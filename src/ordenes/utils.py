from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView


class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super(MyTokenObtainPairSerializer, cls).get_token(user)

        token['name'] = '{} {}'.format(user.first_name, user.last_name)
        token['is_admin'] = user.is_superuser
        photo = ''
        optica = None
        try:
            photo = user.empleado.photo.url
        except:
            pass
        try:
            optica = user.empleado.optica.id
        except:
            pass
        token['sucursal'] = optica
        token['photo'] = photo

        return token


class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer


from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import Table, Paragraph
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
pdfmetrics.registerFont(TTFont('Vera', 'Vera.ttf'))
pdfmetrics.registerFont(TTFont('VeraBd', 'VeraBd.ttf'))
pdfmetrics.registerFont(TTFont('VeraIt', 'VeraIt.ttf'))
pdfmetrics.registerFont(TTFont('VeraBI', 'VeraBI.ttf'))
pdfmetrics.registerFont(TTFont('WalkAway', 'Walkway UltraBold.ttf'))
pdfmetrics.registerFont(TTFont('WalkAway-Bold', 'Walkway Oblique Bold.ttf'))



PAGE_WIDTH = 500
PAGE_HEIGHT = 350
# Inicio de los estilos
styleSheet = getSampleStyleSheet()


def writeParagraph(partext,style,canvas,x,y,width):
    """
    Método para dibujar un párrafo en el canvas
    :param partext: Texto del párrafo con markup
    :param style: stilo del párrafo
    :param canvas: el canvas sobre el que se pintará
    :param x: coordenada x
    :param y: coordenada y
    :param width: el ancho del párrafo a escribir (para evitar usar translate)
    :return:
    """
    par = Paragraph(partext,style)
    par.wrap(width, PAGE_HEIGHT)
    par.drawOn(canvas, x, y)


def writeTable(data,tablestyle,canvas,x,y,colWidth):
    table = Table(data,colWidths=colWidth)
    table.setStyle(tablestyle)
    table.wrap(PAGE_WIDTH,PAGE_HEIGHT)
    table.drawOn(canvas,x,y)


def writeVerticalStrings(canvas):
    canvas.rotate(90)
    # Las coordenadas de y deben ser negativas
    writeParagraph("<font face='Courier-Bold' size=8>LEJOS</font>", styleSheet['BodyText']
                   , canvas, 132, -29,PAGE_WIDTH)
    writeParagraph("<font face='Courier-Bold' size=8>CERCA</font>", styleSheet['BodyText']
                   , canvas, 95, -29,PAGE_WIDTH)
    writeParagraph("<font face='Courier-Bold' size=8>LENTE</font>", styleSheet['BodyText']
                   , canvas, 135, -264,PAGE_WIDTH)
    writeParagraph("<font face='Courier-Bold' size=8>ARO</font>", styleSheet['BodyText']
                   , canvas, 85, -264, PAGE_WIDTH)
    canvas.rotate(-90)

def roundedRightTopRect(canvas,x,y,width,height,radius,stroke=1,fill=0):
    p = canvas.beginPath()

    t = 0.4472 * radius

    x0 = x
    x1 = x0 + t
    x2 = x0 + radius
    x3 = x0 + width - radius
    x4 = x0 + width - t
    x5 = x0 + width

    y0 = y
    y1 = y0 + t
    y2 = y0 + radius
    y3 = y0 + height - radius
    y4 = y0 + height - t
    y5 = y0 + height

    p.moveTo(x2, y0)
    p.lineTo(x3, y0)  # línea de abajo
    p.curveTo(x4, y0, x5, y1, x5, y2)  # abajo derecha
    p.lineTo(x5, y5)  # borde derecha
    p.lineTo(x2, y5)  # fila de arriba
    p.curveTo(x1, y5, x0, y4, x0, y3)  # arriba izquierda
    p.lineTo(x0, y2)  # lborde izquierdo
    p.curveTo(x0, y1, x1, y0, x2, y0)  # abajo izquierda
    canvas.drawPath(p,stroke,fill)

def roundedNoBottom(canvas,x,y,width,height,radius):
    p = canvas.beginPath()

    t = 0.4472 * radius

    x0 = x
    x1 = x0 + t
    x2 = x0 + radius
    x3 = x0 + width - radius
    x4 = x0 + width - t
    x5 = x0 + width

    y0 = y
    y3 = y0 + height - radius
    y4 = y0 + height - t
    y5 = y0 + height

    p.moveTo(x5, y0)  # bottom row
    p.lineTo(x5, y3)  # right edge
    p.curveTo(x5, y4, x4, y5, x3, y5)  # top right
    p.lineTo(x2, y5)  # top row
    p.curveTo(x1, y5, x0, y4, x0, y3)  # top left
    p.lineTo(x0, y0)  # left edge
    canvas.drawPath(p,1,0)

def drawDiagonal(canvas,x,y,width,height,radius,flag):

    canvas.saveState()

    t = 0.4472 * radius

    p = canvas.beginPath()

    x0 = x
    x1 = x0 + t
    x2 = x0 + radius
    x4 = x0 + width - t

    y0 = y
    y3 = y0 + height - radius
    y4 = y0 + height - t

    p.moveTo(x0, y0)
    p.lineTo(x4, y4)
    p.lineTo(x1, y4)
    p.curveTo(x1, y4, x2, y4, x0, y3)  # top left
    p.lineTo(x0,y0)
    if flag:
        canvas.setFillColor(colors.darkblue)
        text = 'P'
    else:
        canvas.setFillColor(colors.darkred)
        text = 'O'
    canvas.drawPath(p, stroke=0, fill=1)
    writeParagraph('<font color=white name="Courier-Bold" size=9>{}</font>'.format(text),
                   styleSheet['BodyText'],
                   canvas, x0 + 3, y0 + 7, PAGE_WIDTH)
    canvas.restoreState()

def customRoundRect(canvas, x, y, width, height, radius, pos, stroke=1,fill=0, color = None):
    """Draws a rectangle with rounded corners. The corners are
    approximately quadrants of a circle, with the given radius."""
    #use a precomputed set of factors for the bezier approximation
    #to a circle. There are six relevant points on the x axis and y axis.
    #sketch them and it should all make sense!

    canvas.saveState()


    if color is not None:
        canvas.setFillColorRGB(color[0]/255,color[1]/255,color[2]/255,color[3])

    p = canvas.beginPath()

    t = 0.4472 * radius

    x0 = x
    x1 = x0 + t
    x2 = x0 + radius
    x3 = x0 + width - radius
    x4 = x0 + width - t
    x5 = x0 + width

    y0 = y
    y1 = y0 + t
    y2 = y0 + radius
    y3 = y0 + height - radius
    y4 = y0 + height - t
    y5 = y0 + height

    p.moveTo(x2, y0)
    p.lineTo(x3, y0) #bottom row
    if pos.get('br',False):
        p.curveTo(x4, y0, x5, y1, x5, y2) #bottom right
    else:
        p.lineTo(x5, y0)
    p.lineTo(x5, y3) #right edge
    if pos.get('tr',False):
        p.curveTo(x5, y4, x4, y5, x3, y5) #top right
    else:
        p.lineTo(x5,y5)
    p.lineTo(x2, y5) #top row
    if pos.get('tl',False):
        p.curveTo(x1, y5, x0, y4, x0, y3) #top left
    else:
        p.lineTo(x0,y5)
    p.lineTo(x0, y2) #left edge
    if pos.get('bl',False):
        p.curveTo(x0, y1, x1, y0, x2, y0) #bottom left
    else:
        p.lineTo(x0,y0)
    p.close()

    canvas.drawPath(p,stroke=stroke,fill=fill)

    canvas.restoreState()

def drawGrid(self,x1 = [], y1 = [], x2 = [], y2=[]):
    drawHorizontalGrid(self,x1, y1)
    drawVerticalGrid(self,x2, y2)

def drawHorizontalGrid(self, x=[],y=[]):
    if len(x) != len(y) + 1:
        return
    for i in range(len(y)) :
        self.line(x[0],y[i],x[i+1],y[i])

def drawVerticalGrid(self,x = [], y = []):
    if len(x) + 1 != len(y):
        return
    for i in range(len(x)):
        self.line(x[i],y[0],x[i],y[i+1])

def writeHorizontalString(canvas,str,x,y,font='Helvetica',size=8,color=None):
    p = canvas
    p.saveState()
    if color is not None:
        p.setFillColorRGB(color[0]/255,color[1]/255,color[2]/255)
    p.setFont(font,size)
    p.drawString(x, y, str)
    p.restoreState()

def writeHorizontalStringList(canvas,str=[],x=[],y=[],font=None, size=None, color=None):
    if len(x) != len(y) or len(str) != len(x):
        return
    for i in range(len(x)):
        if font is not None and size is not None:
            if color is not None:
                writeHorizontalString(canvas,str[i],x[i],y[i],font=font,size=size,color=color)
            else:
                writeHorizontalString(canvas,str[i],x[i],y[i],font=font,size=size)
        else:
            if color is not None:
                writeHorizontalString(canvas,str[i],x[i],y[i],color=color)
            else:
                writeHorizontalString(canvas,str[i],x[i],y[i])

def writeVerticalStringList(canvas,str=[],x=[],y=[],font=None, size=None, color=None):
    canvas.saveState()
    canvas.rotate(90)
    if len(x) != len(y) or len(str) != len(x):
        return
    for i in range(len(x)):
        if font is not None and size is not None:
            if color is not None:
                writeHorizontalString(canvas,str[i],x[i],-y[i],font=font,size=size,color=color)
            else:
                writeHorizontalString(canvas,str[i],x[i],-y[i],font=font,size=size)
        else:
            if color is not None:
                writeHorizontalString(canvas,str[i],x[i],-y[i],color=color)
            else:
                writeHorizontalString(canvas,str[i],x[i],-y[i])
    canvas.restoreState()