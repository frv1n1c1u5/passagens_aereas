import streamlit as st
from amadeus import Client, ResponseError
import os
from dotenv import load_dotenv
import datetime
import requests

# Carregar variáveis de ambiente do arquivo .env
load_dotenv()

# Configurar o cliente Amadeus
amadeus = Client(
    client_id=os.getenv('AMADEUS_CLIENT_ID'),
    client_secret=os.getenv('AMADEUS_CLIENT_SECRET')
)

# Função para converter nomes de cidades em códigos IATA
def obter_codigo_iata(cidade):
    try:
        response = amadeus.reference_data.locations.get(
            keyword=cidade,
            subType='AIRPORT,CITY'
        )
        return response.data[0]['iataCode']
    except:
        return None

# Função para obter taxas de câmbio
def obter_taxa_cambio(base_currency='USD'):
    # Usando a API de taxas de câmbio abertas (exemplo)
    # Substitua 'SUA_API_KEY' pela sua chave de API real
    url = f"https://api.exchangerate-api.com/v4/latest/{base_currency}"
    response = requests.get(url)
    data = response.json()
    rates = data['rates']
    return rates

# Início do aplicativo Streamlit
st.set_page_config(page_title='Busca de Passagens Aéreas', page_icon='✈️', layout='wide')
st.title('✈️ Busca de Passagens Aéreas')

# Seção de entrada de dados
st.sidebar.header('Parâmetros de Busca')
with st.sidebar.form(key='search_form'):
    origem_cidade = st.text_input('Origem', 'São Paulo')
    destino_cidade = st.text_input('Destino', 'Rio de Janeiro')
    data_ida = st.date_input('Data de Ida', datetime.date.today())
    data_volta = st.date_input('Data de Volta', datetime.date.today() + datetime.timedelta(days=7))
    adultos = st.number_input('Número de Adultos', min_value=1, max_value=9, value=1)

    # Filtros adicionais
    st.subheader('Filtros Adicionais')
    preco_max = st.number_input('Preço Máximo', min_value=0, value=5000)
    moeda = st.selectbox('Moeda', options=['BRL', 'USD', 'EUR'])
    escalas = st.selectbox('Número Máximo de Escalas', options=[0, 1, 2, 3])
    companhias = st.text_input('Companhias Aéreas Preferidas (códigos IATA, separados por vírgula)', '')

    submit_button = st.form_submit_button(label='Buscar')

if submit_button:
    with st.spinner('Buscando voos...'):
        try:
            # Converter nomes de cidades em códigos IATA
            origem = obter_codigo_iata(origem_cidade)
            destino = obter_codigo_iata(destino_cidade)

            if not origem or not destino:
                st.error('Não foi possível encontrar os códigos IATA para as cidades informadas.')
            else:
                response = amadeus.shopping.flight_offers_search.get(
                    originLocationCode=origem,
                    destinationLocationCode=destino,
                    departureDate=data_ida.strftime('%Y-%m-%d'),
                    returnDate=data_volta.strftime('%Y-%m-%d'),
                    adults=int(adultos),
                    max=50  # Número máximo de resultados
                )
                resultados = response.data

                # Obter taxas de câmbio
                taxas_cambio = obter_taxa_cambio('USD')
                taxa_selecionada = taxas_cambio.get(moeda, 1)

                # Filtrar resultados conforme necessário
                voos_filtrados = []
                for voo in resultados:
                    preco_usd = float(voo['price']['grandTotal'])
                    preco_convertido = preco_usd * taxa_selecionada
                    itineraries = voo['itineraries']
                    numero_escalas = sum(len(itinerary['segments']) - 1 for itinerary in itineraries)
                    cod_companhias = [segment['carrierCode'] for itinerary in itineraries for segment in itinerary['segments']]

                    # Aplicar filtros
                    if preco_convertido <= preco_max and numero_escalas <= escalas:
                        if companhias:
                            companhias_preferidas = [c.strip().upper() for c in companhias.split(',')]
                            if not any(c in cod_companhias for c in companhias_preferidas):
                                continue
                        voo['price']['grandTotalConverted'] = preco_convertido
                        voos_filtrados.append(voo)

                # Exibir os resultados
                if voos_filtrados:
                    st.success(f"Encontramos {len(voos_filtrados)} voos com os critérios selecionados.")
                    for voo in voos_filtrados:
                        st.markdown('---')
                        col1, col2 = st.columns([2, 1])

                        with col1:
                            st.subheader(f"Preço: {moeda} {voo['price']['grandTotalConverted']:.2f}")
                            for itinerary in voo['itineraries']:
                                st.write("**Itinerário:**")
                                for segment in itinerary['segments']:
                                    partida = datetime.datetime.strptime(segment['departure']['at'], '%Y-%m-%dT%H:%M:%S')
                                    chegada = datetime.datetime.strptime(segment['arrival']['at'], '%Y-%m-%dT%H:%M:%S')
                                    st.write(f"{segment['departure']['iataCode']} ➡️ {segment['arrival']['iataCode']}")
                                    st.write(f"Companhia: {segment['carrierCode']}")
                                    st.write(f"Partida: {partida.strftime('%d/%m/%Y %H:%M')}")
                                    st.write(f"Chegada: {chegada.strftime('%d/%m/%Y %H:%M')}")
                                    st.write("---")
                            total_escalas = sum(len(itinerary['segments']) - 1 for itinerary in voo['itineraries'])
                            st.write(f"**Total de Escalas:** {total_escalas}")
                        with col2:
                            st.write(" ")  # Espaço vazio
                            st.write(" ")  # Espaço vazio
                            st.write(" ")  # Espaço vazio
                            st.write(" ")  # Espaço vazio
                            st.image('https://via.placeholder.com/150', caption='Logo da Companhia', use_column_width=True)
                else:
                    st.warning("Nenhum voo encontrado com os critérios selecionados.")

        except ResponseError as error:
            st.error(f"Ocorreu um erro: {error}")

# Seção para configurar notificações por e-mail
st.sidebar.header('Configurar Notificações de Preço')
with st.sidebar.form(key='notification_form'):
    email = st.text_input('Seu e-mail para notificações')
    preco_alerta = st.number_input('Notificar quando o preço estiver abaixo de', min_value=0, value=500)
    moeda_alerta = st.selectbox('Moeda da Notificação', options=['BRL', 'USD', 'EUR'])
    frequencia = st.selectbox('Frequência de Verificação', options=['Diariamente', 'Semanalmente'])
    configurar_alerta = st.form_submit_button(label='Configurar Alerta')

if configurar_alerta:
    if email and '@' in email:
        # Salvar preferências do usuário (simplificado - em um arquivo)
        with open('alertas.txt', 'a') as f:
            f.write(f"{email},{origem_cidade},{destino_cidade},{data_ida},{data_volta},{adultos},{preco_alerta},{moeda_alerta},{frequencia}\n")
        st.success('Alerta configurado com sucesso!')
    else:
        st.error('Por favor, insira um e-mail válido.')
