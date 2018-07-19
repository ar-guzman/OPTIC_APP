from django.http import HttpResponse
from django.shortcuts import render
import base64
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.utils import ImageReader
# Información de la fecha
import datetime

from rest_framework.decorators import api_view

now = datetime.datetime.now()
meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre',
         'Diciembre']

from django.conf import settings
import os

# Create your views here.
from .utils import PAGE_WIDTH, PAGE_HEIGHT, writeVerticalStrings, roundedRightTopRect, roundedNoBottom, \
    drawGrid, writeTable, writeParagraph, styleSheet, drawDiagonal, customRoundRect, writeHorizontalStringList, \
    writeVerticalStringList, writeHorizontalString


def orden_completa(request):
    return render(request, 'orden_completa.html', {})


from io import BytesIO
from reportlab.pdfgen import canvas
from django.http import HttpResponse

# Registro de fuentes para usar en platypus
from reportlab.lib import colors
from reportlab.platypus import TableStyle


def pdfreport(request, datos):
    print(datos)
    logo = os.path.join(settings.BASE_DIR, 'static/images/icono.png')
    buffer = BytesIO()
    # Creación del objeto PDF, usando BytesIO como el archivo para optimizar
    p = canvas.Canvas(buffer, pagesize=(PAGE_WIDTH, PAGE_HEIGHT))
    # Generación del pdf
    image = ImageReader(logo)
    p.drawImage(image, 15, 215, 100, 75, mask='auto', preserveAspectRatio=True)
    header(p, datos)
    # Número de orden y fecha
    writeParagraph("""Guatemala, {} de {} de {}""".format(datos['fecha'].day, meses[datos['fecha'].month - 1],
                                                          datos['fecha'].year), styleSheet['BodyText'], p, 155,
                   227.5, PAGE_WIDTH)
    writeParagraph('<font color=red size=16>C-{:06.0f}</font>'.format(datos['ordenID']), styleSheet['BodyText'],
                   p, PAGE_WIDTH - 100, PAGE_HEIGHT - 25, PAGE_WIDTH)
    # Tabla de diagnóstico
    p.setFillColorRGB(229 / 256, 235 / 256, 249 / 256)
    drawDiagonal(p, 30, 162, 20.75, 21, 2, True)
    p.roundRect(175, 90, 50.5, 72, 2, stroke=False, fill=True)
    writeTable([[''],
                ['O.I.'],
                ['O.D.'],
                ['O.I.'],
                ['O.D.']], TableStyle([
        ('INNERGRID', (0, 1), (-1, -1), 0.25, colors.black),
        ('SIZE', (0, 0), (-1, -1), 8)
    ]), p, 30, 90, 50)
    writeParagraph('<font size=8>Rx</font>',
                   styleSheet['BodyText'], p, 39, 161, 63)
    p.line(30, 162, 50, 182)

    writeTable([['ESFERA', 'CILINDRO', 'EJE', 'ADICION'],
                [datos['ref']['esfOSF'], datos['ref']['cilOSF'], datos['ref']['ejeOSF'], datos['ref']['addOI']],
                [datos['ref']['esfODF'], datos['ref']['cilODF'], datos['ref']['ejeODF'], datos['ref']['addOD']],
                [datos['ref']['esfOSC'], datos['ref']['cilOSC'], datos['ref']['ejeOSC'], datos['ref']['addOI']],
                [datos['ref']['esfODC'], datos['ref']['cilODC'], datos['ref']['ejeODC'], datos['ref']['addOD']],
                ],
               TableStyle([
                   ('INNERGRID', (0, 1), (-1, -1), 0.25, colors.black),
                   ('BACKGROUND', (0, 1), (3, 4), colors.Color(229 / 256, 235 / 256, 249 / 256)),
                   ('SIZE', (0, 0), (-1, -1), 8),
                   ('SIZE', (0, 1), (-1, -1), 10),
                   ('ALIGN', (0, 0), (-1, -1), 'CENTER'), ]), p, 50, 90, 45)

    roundedRightTopRect(p, 15, 90, 215, 72, 2)
    p.line(30, 90, 30, 162)
    p.line(15, 126, 230, 126)
    roundedNoBottom(p, 30, 162, 200, 20, 2)
    drawGrid(p, 50, 90, 92, 45, 4)
    # TABLA DE LOS LENTES <INICIO>
    roundedRightTopRect(p, 265, 130.5, 195, 35, 2, stroke=0, fill=1)
    roundedRightTopRect(p, 250, 131, 210, 34, 2)
    writeTable([['MATERIAL', 'TIPO', 'AGREGADOS'], [datos['lente']['material'], datos['lente']['tipo'],
                                                    datos['lente']['color']]],
               TableStyle([
                   ('ALIGNMENT', (0, 0), (-1, -1), 'CENTRE'),
                   ('SIZE', (0, 0), (-1, -1), 8),
                   ('SIZE', (1, 1), (2, 1), 9),
                   ('BOTTOMPADDING', (0, 0), (2, 0), 10)
               ]), p, 265, 140, 65)
    roundedNoBottom(p, 265, 165.5, 195, 20, 2)
    drawGrid(p, 330, 130.5, 55, 65, 2)
    p.line(265, 131, 265, 167.5)
    if len(datos['filtros']) > 1:
        writeParagraph('<font size=9>{}</font>'.format(" ".join(datos['filtros'])),
                       styleSheet['BodyText'], p, 410, 145 - 5 * (len(datos['filtros'])), 65)

    # TABLA DE LOS LENTES <FIN>
    # Escritura de la tabla de aros
    roundedRightTopRect(p, 265, 80, 140, 25, 2, 0, 1)
    roundedRightTopRect(p, 250, 80, 155, 25, 2)
    writeTable([['MARCA', 'MODELO'], [datos['aro']['marca'], datos['aro']['modelo']]], TableStyle([
        ('ALIGNMENT', (0, 0), (-1, -1), 'CENTRE'),
        ('SIZE', (0, 0), (-1, -1), 8),
        ('SIZE', (0, 1), (1, 1), 8)
    ]), p, 265, 85, 70)
    roundedNoBottom(p, 265, 105, 140, 17.5, 2)
    drawGrid(p, 330, 80, 42.5, 70, 1)
    p.line(265, 80, 265, 105)
    # Escritura de los strings verticales (Lejos, Cerca, Lente, Aro)
    writeVerticalStrings(p)
    # Tabla distancia pupilar
    writeTable([['DISTANCIA PUPILAR', '65']], TableStyle([
        ('COLOR', (0, 0), (0, 0), colors.white),
        ('ALIGNMENT', (0, 0), (-1, -1), 'CENTRE'),
        ('SIZE', (0, 0), (0, 0), 8),
        ('SIZE', (1, 0), (1, 0), 8)
    ]), p, 30, 65, 60)
    p.roundRect(15, 67.5, 120, 15, 2)
    p.line(110, 67.5, 110, 82.5)
    # Escritura de las observaciones p:canvas, str:string a escribir
    observaciones(p, datos['observaciones'])
    p.save()
    # Get the value of the BytesIO buffer and write it to the response.
    pdf = buffer.getvalue()
    buffer.close()
    if pdf:
        response = HttpResponse(pdf, content_type='application/pdf')
        response['Content-Disposition'] = 'form-data; name="fieldName"; filename="filename.pdf"'
        response.write(pdf)
        return response
    return HttpResponse("Not found")


def header(p, data):
    writeParagraph("<font size=8> 6a. Calle 1-78, Zona 1 (Esquina) <b> • PBX: </b>(+502) 2232-7202 </font>",
                   styleSheet['BodyText'], p, 126.5, 275, PAGE_WIDTH)
    writeParagraph(
        "<font size=8> 6a. Calle 2-68, Zona 1 <b> • PBX: </b>(+502) 2220-3283 </font>",
        styleSheet['BodyText'], p, 162.5, 265, PAGE_WIDTH)
    writeParagraph(
        "<font size=8> 4a. Calle 20-26, Zona 6 <b> • PBX: </b>(+502) 2289-0293 </font>",
        styleSheet['BodyText'], p, 158, 255, PAGE_WIDTH)
    writeParagraph(
        "<font size=8><b>EMAIL:</b> gnomitosanonimos@gmail.com<b> • FB: </b>facebook.com/OpticaOcularGT</font>",
        styleSheet['BodyText'], p, 112.5, 245, PAGE_WIDTH)
    p.setStrokeColorRGB(6 / 256, 19 / 256, 84 / 256)
    p.setLineWidth(0.5)
    p.roundRect(127, 223.5, 220, 15, 5)
    # Escritura del nombre
    p.setLineWidth(0.8)
    writeParagraph("<font size=9>Nombre del paciente:</font>", styleSheet['BodyText'], p, 75, 200, PAGE_WIDTH)
    writeParagraph("<font size=12>{} {}</font>".format(data['nombre'], data['apellido']),
                   ParagraphStyle('custom', alignment=0), p, 200, 202, PAGE_WIDTH)
    p.setStrokeColorRGB(0, 0, 0)
    p.line(165, 200, 425, 200)


def observaciones(p, texto="----"):
    p.setFillColor(colors.Color(2 / 256, 24 / 256, 61 / 256))
    p.drawString(20, 55, 'OBSERVACIONES')
    p.roundRect(15, 10, 470, 43, 5, 1, 0)
    styleSheet['BodyText'].leading = 8
    styleSheet['BodyText'].textColor = colors.Color(2 / 256, 24 / 256, 61 / 256)
    styleSheet['BodyText'].alignment = 4
    writeParagraph("<font size=8 >{}</font>".format(texto),
                   styleSheet['BodyText'], p, 30, 20, PAGE_WIDTH - 60)


@api_view()
def some_view(request):
    datos = {'ordenID': 28, 'lente': {'tipo': 'Type 1', 'material': 'Mat 1', 'color': 'Color 1'},
             'ref': {'id': 44, 'ejeODC': 0, 'ejeOSC': 0, 'ejeODF': 0, 'ejeOSF': 0, 'cilODC': '0.00', 'cilOSC': '0.00',
                     'cilODF': '0.00', 'cilOSF': '0.00', 'esfODC': '0.00', 'esfOSC': '0.00', 'esfODF': '0.00',
                     'esfOSF': '0.00', 'prismaOD': '5.00', 'tipoprismaOD': 2, 'prismaOS': '0.00', 'tipoprismaOS': 0,
                     'addOD': '0.00', 'addOI': '0.00', 'distC': 0, 'distL': 0, 'observaciones': ''},
             'aro': {'marca': 'Ricardin15', 'modelo': 'BONONO_MONKEY63','color':'3BLUE'},
             'filtros': ['Filtro 1', 'Filtro 2', 'Filtro Colorin'], 'nombre': 'Roberto', 'apellido': 'Bolaños',
             'fecha': datetime.date(2018, 7, 3), 'observaciones': 'Observaciones de prueba',
             'optica':{'nombre':'OCULAR 1'},
             'cliente':{'firstname':'Ricardo','lastname':'Guzmán'},
             'abono':'500.00',
             'saldo':'1900.00',
             }
    logo = os.path.join(settings.BASE_DIR, 'static/images/icono.png')
    buffer = BytesIO()
    # Creación del objeto PDF, usando BytesIO como el archivo para optimizar
    p = canvas.Canvas(buffer, pagesize=(PAGE_WIDTH, PAGE_HEIGHT))
    # Generación del pdf
    image = ImageReader(logo)
    p.drawImage(image, 10, PAGE_HEIGHT - 80, 100, 75, mask='auto', preserveAspectRatio=True)
    drawASC(p)
    drawPAD(p)
    drawLente(p)
    drawAro(p)
    writeHorizontalString(p,"C-{:06.0f}".format(datos['ordenID']),
                          PAGE_WIDTH-95, PAGE_HEIGHT-20,font='WalkAway',size=18,color=[255,0,0])
    #optica
    writeHorizontalString(p, datos['optica']['nombre'].upper(),
                          int(PAGE_WIDTH/2 - (len(datos['optica']['nombre'])/2)*16), PAGE_HEIGHT - 40, font='WalkAway', size=32, color=[5, 50, 4])
    #cliente
    writeHorizontalStringList(p, [datos['cliente']['firstname'],datos['cliente']['lastname']],
                          x = [370 - len(datos['cliente']['firstname'])*9,370],y=[PAGE_HEIGHT/2-20,PAGE_HEIGHT/2-20], font='WalkAway-Bold', size=16, color=[5, 50, 4])
    #abono
    writeHorizontalStringList(p, [datos['abono'], datos['saldo']],
                              x=[325,435],
                              y=[PAGE_HEIGHT / 2 - 105, PAGE_HEIGHT / 2 - 105], font='WalkAway-Bold', size=12,
                              color=[5, 50, 4])
    #lente
    writeHorizontalStringList(p, [datos['lente']['tipo'], datos['lente']['material'],datos['lente']['color']],
                              x=[50-len(datos['lente']['tipo'])/2*5,50-len(datos['lente']['material'])/2*5,125-len(datos['lente']['color'])/2*5],
                              y=[PAGE_HEIGHT / 2 - 75, PAGE_HEIGHT / 2 - 90,PAGE_HEIGHT / 2 - 82.5], font='WalkAway-Bold', size=12,
                              color=[5, 50, 4])
    #filtros
    writeHorizontalStringList(p,datos['filtros'], x=[210 - len(filter)/2*5 for filter in datos['filtros']],
                              y = [PAGE_HEIGHT / 2 - (75 + index*10) for index in range(len(datos['filtros']))],font='WalkAway-Bold', size=12,
                              color=[5, 50, 4])
    #aro
    writeHorizontalStringList(p, [datos['aro']['marca'],datos['aro']['modelo'],datos['aro']['color']],
                              x=[295 - len(datos['aro']['marca']) / 2 * 5,400 - len(datos['aro']['modelo']) / 2 * 5,400 - len(datos['aro']['color']) / 2 * 5],
                              y=[PAGE_HEIGHT / 2 - 70,PAGE_HEIGHT / 2 - 65,PAGE_HEIGHT / 2 - 75],
                              font='WalkAway-Bold', size=10,
                              color=[5, 50, 4])
    #observaciones
    writeParagraph("<font size=10 name='WalkAway-Bold'> {} / {} </font>".format(datos['observaciones'],datos['ref']['observaciones']),
                   styleSheet['BodyText'], p, 15, 30, PAGE_WIDTH-40)
    p.roundRect(10, 10, PAGE_WIDTH - 20, 50, 2)
    writeStaticString(p)
    writeRefraction(p,datos)
    p.setTitle("Orden Completa {}".format(datos['ordenID']))
    p.save()
    # Get the value of the BytesIO buffer and write it to the response.
    pdf = buffer.getvalue()
    buffer.close()
    if pdf:
        response = HttpResponse(pdf, content_type='application/pdf')
        response['Content-Disposition'] = 'inline; name="fieldName"; filename="filename.pdf"'
        response.write(pdf)
        return response
    return HttpResponse("Not found")

def completa_pdf(datos):
    logo = os.path.join(settings.BASE_DIR, 'static/images/icono.png')
    buffer = BytesIO()
    # Creación del objeto PDF, usando BytesIO como el archivo para optimizar
    p = canvas.Canvas(buffer, pagesize=(PAGE_WIDTH, PAGE_HEIGHT))
    # Generación del pdf
    image = ImageReader(logo)
    p.drawImage(image, 10, PAGE_HEIGHT - 80, 100, 75, mask='auto', preserveAspectRatio=True)
    drawASC(p)
    drawPAD(p)
    drawLente(p)
    drawAro(p)
    writeHorizontalString(p, "C-{:06.0f}".format(datos['ordenID']),
                          PAGE_WIDTH - 95, PAGE_HEIGHT - 20, font='Courier-Bold', size=16, color=[255, 0, 0])
    p.roundRect(10, 10, PAGE_WIDTH - 20, 50, 2)
    writeStaticString(p)
    writeRefraction(p,datos)
    p.save()
    # Get the value of the BytesIO buffer and write it to the response.
    pdf = buffer.getvalue()
    buffer.close()
    if pdf:
        response = HttpResponse(pdf, content_type='application/pdf')
        response['Content-Disposition'] = 'inline; name="fieldName"; filename="filename.pdf"'
        response.write(pdf)
        return response
    return HttpResponse("Not found")



def drawASC(canvas):
    p = canvas
    customRoundRect(p, 70, PAGE_HEIGHT / 2 + 75, 180, 25, 2,
                    {'tl': True, 'tr': True}, stroke=1, fill=1, color=[2, 27, 43, 0.8])
    customRoundRect(p, 10, PAGE_HEIGHT / 2 - 25, 30, 100, 2,
                    {'bl': True, 'tl': True}, stroke=1, fill=1, color=[114, 132, 131, 1])
    customRoundRect(p, 40, PAGE_HEIGHT / 2 - 25, 30, 100, 2, {}, stroke=0, fill=1,
                    color=[171, 193, 214, 1])
    customRoundRect(p, 10, PAGE_HEIGHT / 2 - 25, 240, 100, 2,
                    {'br': True, 'bl': True, 'tl': True}, stroke=1, fill=0)
    drawGrid(p, [250, 40, 10, 40], [PAGE_HEIGHT / 2 + 50, PAGE_HEIGHT / 2 + 25, PAGE_HEIGHT / 2],
             [40, 70, 130, 190], [PAGE_HEIGHT / 2 - 25, PAGE_HEIGHT / 2 + 75, PAGE_HEIGHT / 2 + 75,
                                  PAGE_HEIGHT / 2 + 75, PAGE_HEIGHT / 2 + 75])


def drawPAD(canvas):
    p = canvas
    customRoundRect(p, 285, PAGE_HEIGHT / 2 + 75, 120, 25, 2,
                    {'tl': True, 'tr': True}, stroke=1, fill=1, color=[2, 27, 43, 0.8])
    customRoundRect(p, 255, PAGE_HEIGHT / 2 + 25, 30, 50, 2,
                    {'bl': True, 'tl': True}, stroke=1, fill=1, color=[171, 193, 214, 1])
    customRoundRect(p, 285, PAGE_HEIGHT / 2 + 25, 120, 50, 2,
                    {'br': True}, stroke=1, fill=0)
    p.line( 255, PAGE_HEIGHT / 2 + 50, 405, PAGE_HEIGHT / 2 + 50)
    p.line( 345, PAGE_HEIGHT / 2 + 25, 345, PAGE_HEIGHT / 2 + 75)
    customRoundRect(p, PAGE_WIDTH - 90, PAGE_HEIGHT / 2 + 75, 80, 25, 2,
                    {'tl': True, 'tr': True}, stroke=0, fill=1, color=[2, 27, 43, 0.8])
    customRoundRect(p, PAGE_WIDTH - 90, PAGE_HEIGHT / 2 + 50, 80, 50, 2,
                    {'tl': True, 'tr': True, 'br': True, 'bl': True}, stroke=1, fill=0)
    p.line(PAGE_WIDTH - 90, PAGE_HEIGHT / 2 + 75, PAGE_WIDTH - 10, PAGE_HEIGHT / 2 + 75)


def drawLente(canvas):
    p = canvas
    customRoundRect(p, 10, PAGE_HEIGHT / 2 - 55, 240, 25, 2,
                    {'tl': True, 'tr': True}, stroke=1, fill=1, color=[2, 27, 43, 0.8])
    customRoundRect(p, 10, PAGE_HEIGHT / 2 - 110, 240, 55, 2,
                    {'br': True, 'bl': True}, stroke=1, fill=0)
    drawGrid(p, x2=[90, 170], y2=[PAGE_HEIGHT / 2 - 110, PAGE_HEIGHT / 2 - 55, PAGE_HEIGHT / 2 - 55])


def drawAro(canvas):
    p = canvas
    customRoundRect(p, 255, PAGE_HEIGHT / 2 - 55, 235, 25, 2,
                    {'tl': True, 'tr': True}, stroke=1, fill=1, color=[2, 27, 43, 0.8])
    customRoundRect(p, 255, PAGE_HEIGHT / 2 - 80, 235, 25, 2,
                    {'br': True, 'bl': True}, stroke=1, fill=0)
    p.line(335, PAGE_HEIGHT / 2 - 80, 335, PAGE_HEIGHT / 2 - 55)
    p.line(255, PAGE_HEIGHT / 2 - 25, PAGE_WIDTH - 10, PAGE_HEIGHT / 2 - 25)



def writeStaticString(canvas):
    mid = PAGE_WIDTH/2
    writeHorizontalStringList(canvas,str=['NOMBRE DEL PACIENTE:','OBSERVACIONES:','ABONO:','SALDO:'],
                              x=[255,15,255,375],y=[PAGE_HEIGHT / 2 + 5, 46,PAGE_HEIGHT / 2 - 110,PAGE_HEIGHT / 2 - 110],font = "Vera", size=14)
    writeHorizontalStringList(canvas,str=['DIRECCION:','PBX:','CORREO:','REDES:'],
                              x=[mid-120,mid+60,mid-100,mid+40],y=[PAGE_HEIGHT-60,PAGE_HEIGHT-60,PAGE_HEIGHT-70,PAGE_HEIGHT-70],
                              font="Helvetica-Bold",size=9)
    asc = PAGE_HEIGHT / 2 + 83
    padd = PAGE_HEIGHT/2 - 47.5
    writeHorizontalStringList(canvas, str=['ESFERA','CILINDRO','EJE','PRISMA','ADD','DISTANCIA','PUPILAR',
                                           'LENTE', 'COLOR','AGREGADOS','MARCA','ARO'],
                              x=[80,133,210,295,365,421,426,35,115,180,277.5,400],
                              y=[asc,asc,asc,asc,asc,asc+6,asc-5,padd,padd,padd,padd,padd], font="Courier-Bold",
                              size=11, color=[255,255,255])
    writeHorizontalStringList(canvas, str=['OD','OS','OD','OS','OD','OS'],
                              x=[47.5,47.5,47.5,47.5,262.5,262.5],
                              y=[asc-25,asc-50,asc-75,asc-100,asc-25,asc-50], font="Courier-Bold",
                              size = 12, color = [3, 67, 94])
    writeVerticalStringList(canvas,str=['LEJOS','CERCA'],
                         y=[28,28],
                         x=[asc-52,asc-100], font="Courier-Bold",
                         size=12, color=[255,255,255])
    canvas.line(315,PAGE_HEIGHT / 2 - 110, 370, PAGE_HEIGHT / 2 - 110)
    canvas.line(430,PAGE_HEIGHT / 2 - 110, PAGE_WIDTH - 10,PAGE_HEIGHT / 2 - 110)

def writeRefraction(canvas,datos):
    asc = PAGE_HEIGHT / 2 + 83
    writeHorizontalStringList(canvas, str=[crv(datos['ref']['esfOSF']), crv(datos['ref']['cilOSF']), sphv(datos['ref']['ejeOSF']),
                                           crv(datos['ref']['esfODF']), crv(datos['ref']['cilODF']), sphv(datos['ref']['ejeODF']),
                                           crv(datos['ref']['esfOSC']), crv(datos['ref']['cilOSC']), sphv(datos['ref']['ejeOSC']),
                                           crv(datos['ref']['esfODC']), crv(datos['ref']['cilODC']), sphv(datos['ref']['ejeODC'])],
                x=[85,145,210,85,145,210,85,145,210,85,145,210],
                y=[asc-25,asc-25,asc-25,asc-50,asc-50,asc-50,asc-75,asc-75,asc-75,asc-100,asc-100,asc-100],
                font="Helvetica-Oblique",size=12)
    writeHorizontalString(canvas, str="{}/{}".format(datos['ref']['distC'] if datos['ref']['distC'] != 0 else "-",datos['ref']['distL'] if datos['ref']['distL'] != 0 else "-"),
                          x=440,y=asc-25,font="WalkAway-Bold",size=12)
    writeHorizontalStringList(canvas,
                              str=["{}".format((datos['ref']['addOD']) if datos['ref']['addOD'] != '0.00' else "-"),
                                   "{}".format((datos['ref']['addOI']) if datos['ref']['addOD'] != '0.00' else "-")],
                              x=[310,375],
                              y=[asc - 50, asc - 50],
                              font="Helvetica-Oblique", size=10)
    prismaOD = datos['ref']['prismaOD'] if datos['ref']['tipoprismaOD'] != 0 else "-"
    bolprismaOD = True if datos['ref']['tipoprismaOD'] != 0 else False
    prismaOS = datos['ref']['prismaOS'] if datos['ref']['tipoprismaOS'] != 0 else "-"
    bolprismaOS = True if datos['ref']['tipoprismaOD'] != 0 else False
    prismas = []
    x = []
    y = []
    if bolprismaOD:
        prismas.append(prismaOD)
        prismas.append(basePrisma(datos['ref']['tipoprismaOD']))
        x.append(305)
        x.append(300)
        y.append(asc - 20)
        y.append(asc - 30)
    else:
        prismas.append(prismaOD)
        x.append(305)
        y.append(asc - 25)
    if bolprismaOS:
        prismas.append(prismaOS)
        prismas.append(basePrisma(datos['ref']['tipoprismaOS']))
        x.append(375)
        x.append(375)
        y.append(asc - 20)
        y.append(asc - 30)
    else:
        print('acaOS')
        prismas.append(prismaOS)
        x.append(375)
        y.append(asc - 25)
    writeHorizontalStringList(canvas,
                              str=prismas,
                              x=x,
                              y=y,
                              font="Helvetica", size=10)

def basePrisma(tipo:int):
    if tipo == 0:
        return ""
    elif tipo == 1:
        return 'Interno'
    elif tipo == 2:
        return 'Externo'
    elif tipo == 4:
        return 'Inferior'
    else:
        return 'Superior'

def crv(valor):
    if valor == '0.00':
        return '  -  '
    else:
        return valor

def sphv(valor):
    if valor == 0:
        return ' - '
    else:
        return "{}°".format(valor)