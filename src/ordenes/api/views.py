import re
import datetime
from uuid import UUID

from django.core.paginator import InvalidPage
from django.db import transaction
from django.utils import six

from rest_framework import permissions, status
from rest_framework.decorators import api_view, action
from rest_framework_simplejwt import authentication as authenticationjwt

from rest_framework.utils import json
from rest_framework.exceptions import NotFound
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet
from rest_framework.pagination import PageNumberPagination

from inventario.models import Inventario, Lente, Filtro
from inventario.api.serializers import InventarioSerializer,OpticaSerializer

from ..views import pdfreport, some_view, completa_pdf
from ..models import Empleado, Cliente, Aro_Orden, Abono_Aro, Completa_Orden, Abono_Completa, Refraction
from .serializers import EmpleadoSerializer, ClienteSerializer, AroOrdenSerializer, RefractionSerializer, \
    CompletaOrdenSerializer, CompletaOrdenInfoSerializer


def parseDataToOrder(orden, refraction = None):
    datos = {}
    datos['ordenID'] = orden.id
    datos['lente'] = {'tipo': orden.lente.tipo, 'material': orden.lente.material, 'color': orden.lente.color}
    if refraction is not None:
        datos['ref'] = refraction.data
    else:
        datos['ref'] = {}
        for key in ['ejeODC','ejeOSC','ejeODF','ejeOSF','cilODC','cilOSC','cilODF','cilOSF',
                'esfODC','esfOSC','esfODF','esfOSF','prismaOD','tipoprismaOD','prismaOS','tipoprismaOS',
                'addOD','addOS','distC','distL']:
            datos['ref'][key] = 0

    datos['aro'] = {'marca': orden.inventario.aro.marca.name,
                    'modelo': "{} {}".format(orden.inventario.aro.modelo, orden.inventario.aro.color)}
    fil = []
    for i in orden.filtros.all().filter():
        fil.append(i.filtro)
    datos['filtros'] = fil
    datos['nombre'] = orden.cliente.firstname
    datos['apellido'] = orden.cliente.lastname
    datos['fecha'] = orden.fecha
    datos['observaciones'] = "Refracción: {}\n Generales: {}".format(refraction.data.get('observaciones'),
                                                                     orden.observaciones)
    opticaSer = OpticaSerializer(instance=orden.inventario.optica)
    datos['optica'] = opticaSer.data
    return datos

def payment_type(val):
    """
    tipo
        1 = cheque
        2 = efectivo
        3 = tarjeta
    :param val: valor a traducir
    :return:
    """
    if val == 1:
        return 'Cheque'
    elif val == 2:
        return 'Efectivo'
    elif val == 3:
        return 'Tarjeta'
    else:
        return 'No debería de pasar'

def order_status(val):
    """
    status
        "0" Pendiente
        "1" Listo
        "2" Entregado
        "3" Con Problemas
    :param val: valor a traducir
    :return:
    """
    if val == 0:
        return 'Pendiente'
    elif val == 1:
        return 'Listo'
    elif val == 2:
        return 'Entregado'
    elif val == 3:
        return 'Con Problemas'
    elif val == 4:
        return 'Cancelado'
    else:
        return 'No debería de pasar'


def get_object_or_None(Model, **kwargs):
    try:
        obj = Model.objects.get(**kwargs)
        return obj
    except Model.DoesNotExist:
        return None


def save_refraccion(data, **kwargs):
    if not bool(data):
        return None
    serializer = RefractionSerializer(data=parse_refraccion(data, **kwargs))
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return serializer


def parse_refraccion(data, **kwargs):
    ASCODFAR = data['ASC-OD-FAR']
    ASCOIFAR = data['ASC-OI-FAR']
    ASCODCLO = data['ASC-OD-CLOSE']
    ASCOICLO = data['ASC-OI-CLOSE']
    PRISMAADDOD = data['PRISMA-ADD-OD']
    PRISMAADDOS = data['PRISMA-ADD-OS']
    DP = data['dp-lejos-cerca']
    ejeODC = ASCODCLO.get('eje', 0)
    ejeOSC = ASCOICLO.get('eje', 0)
    ejeODF = ASCODFAR.get('eje', 0)
    ejeOSF = ASCOIFAR.get('eje', 0)
    cilODC = ASCODCLO.get('cilindro', 0)
    cilOSC = ASCOICLO.get('cilindro', 0)
    cilODF = ASCODFAR.get('cilindro', 0)
    cilOSF = ASCOIFAR.get('cilindro', 0)
    esfODC = ASCODCLO.get('esfera', 0)
    esfOSC = ASCOICLO.get('esfera', 0)
    esfODF = ASCODFAR.get('esfera', 0)
    esfOSF = ASCOIFAR.get('esfera', 0)
    prismaOD = PRISMAADDOD.get('prisma', 0)
    tipoprismaOD = PRISMAADDOD.get('base', 0)
    prismaOS = PRISMAADDOS.get('prisma', 0)
    tipoprismaOS = PRISMAADDOS.get('base', 0)
    addOD = PRISMAADDOD.get('add', 0)
    addOS = PRISMAADDOS.get('add', 0)
    distL = DP.get('dp-lejos', 0)
    distC = DP.get('dp-cerca', 0)
    obs = data['observaciones']
    return {'ejeODC': ejeODC, 'ejeOSC': ejeOSC, 'ejeODF': ejeODF, 'ejeOSF': ejeOSF,
                'cilODC': cilODC, 'cilOSC': cilOSC, 'cilODF': cilODF, 'cilOSF': cilOSF,
                'esfODC': esfODC, 'esfOSC': esfOSC, 'esfODF': esfODF, 'esfOSF': esfOSF,
                'prismaOD': prismaOD, 'tipoprismaOD': tipoprismaOD, 'prismaOS': prismaOS,
                'tipoprismaOS': tipoprismaOS,
                'addOD': addOD, 'addOS': addOS, 'distC': distC, 'distL': distL,
                'observaciones': obs, 'propia': kwargs['propia'], 'cliente': kwargs['cliente'].pk,
                'orden':kwargs['orden']}

class DefaultsMixin(object):
    """Default settings for view authentication, permissions,
    filtering"""
    authentication_classes = (
        authenticationjwt.JWTAuthentication,
    )

    permission_classes = (
        permissions.IsAuthenticated,
        permissions.DjangoModelPermissions,
    )


class DefaultPagination(PageNumberPagination):
    page_size = 15
    page_size_query_param = 'page_size'
    max_page_size = 100

    def get_paginated_response(self, data):
        return Response({
            'previous': self.page.has_previous(),
            'next': self.page.has_next(),
            'current': self.page.number,
            'count': self.page.paginator.count,
            'results': data
        })

    def paginate_queryset(self, queryset, request, view=None):
        """
        Paginate a queryset if required, either returning a
        page object, or `None` if pagination is not configured for this view.
        """
        if request.query_params.get(self.page_size_query_param, None) == 'all':
            self.page = 1
            return None

        page_size = self.get_page_size(request)
        if not page_size:
            return None

        paginator = self.django_paginator_class(queryset, page_size)
        page_number = request.query_params.get(self.page_query_param, 1)
        if page_number in self.last_page_strings:
            page_number = paginator.num_pages

        try:
            self.page = paginator.page(page_number)
        except InvalidPage as exc:
            msg = self.invalid_page_message.format(
                page_number=page_number, message=six.text_type(exc)
            )
            raise NotFound(msg)

        if paginator.num_pages > 1 and self.template is not None:
            # The browsable API should display pagination controls.
            self.display_page_controls = True

        self.request = request
        return list(self.page)


class DefaultModelViewSet(ModelViewSet):

    def get_full_response(self, data):
        return Response({
            'previous': False,
            'next': False,
            'current': 1,
            'count': len(data),
            'results': data
        })

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(queryset, many=True)
        if 'partial' in request.query_params:
            return Response({'results': serializer.data})
        return self.get_full_response(serializer.data)


class EmpleadoViewSet(DefaultsMixin, DefaultModelViewSet):
    serializer_class = EmpleadoSerializer
    pagination_class = DefaultPagination
    lookup_field = 'uuid'

    def get_queryset(self):
        qs = Empleado.objects.all().order_by('id')
        qs = qs.filter(user__is_active=True)
        return qs


class ClienteViewSet(DefaultsMixin, DefaultModelViewSet):
    serializer_class = ClienteSerializer
    pagination_class = DefaultPagination
    lookup_field = 'uuid'

    def get_queryset(self):
        qs = Cliente.objects.all().order_by('id')
        firstname = self.request.GET.get('firstname', None)
        lastname = self.request.GET.get('lastname', None)
        contact = self.request.GET.get('contact_1', None)
        if firstname is not None and firstname != "":
            qs = qs.filter(firstname__iexact=firstname.strip())
        if lastname is not None and lastname != "":
            qs = qs.filter(lastname__iexact=lastname.strip())
        if contact is not None and contact != "":
            qs = qs.filter(contact_1__iexact=contact)
        return qs

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(queryset, many=True)
        if not queryset:
            return Response(status=status.HTTP_404_NOT_FOUND)
        if 'partial' in request.query_params:
            return Response({'results': serializer.data})
        return self.get_full_response(serializer.data)

    def retrieve(self, request, *args, **kwargs):
        try:
            UUID(kwargs.get('uuid', '0'), version=4)
            instance = self.get_object()
            serializer = self.get_serializer(instance)
            datos = dict(serializer.data)
            refraction = []
            for ref in instance.refraction.all():
                refraction.append({'id': ref.id, 'fecha': ref.fecha, 'orden':"{:06.0f}".format(ref.orden),
                                   'propia': ref.propia, 'obs': ref.observaciones})
            datos['refractions'] = refraction
            return Response(datos)
        except ValueError:
            self.lookup_field = 'pk'
            self.kwargs['pk'] = self.kwargs.pop('uuid')
            instance = self.get_object()
            serializer = self.get_serializer(instance)
            datos = dict(serializer.data)
            refraction = []
            for ref in instance.refraction.all():
                refraction.append({'id': ref.id, 'fecha': ref.fecha,
                                   'propia': ref.propia, 'observaciones': ref.observaciones})
            datos['refractions'] = refraction
            return Response(datos)


class AroOrdenViewSet(DefaultsMixin, DefaultModelViewSet):
    serializer_class = AroOrdenSerializer
    pagination_class = DefaultPagination
    lookup_field = 'uuid'

    def get_queryset(self):
        qs = Aro_Orden.objects.all().order_by('id', 'fecha')
        ini_date = self.request.GET.get('ini_date', None)
        last_date = self.request.GET.get('last_date', None)
        ini_bool = ini_date is not None and ini_date != ""
        last_bool = last_date is not None and last_date != ""
        if ini_bool:
            ini_date = datetime.datetime(*[int(v) for v in ini_date.replace('T', '-').replace(':', '-').split('-')])
        if last_bool:
            last_date = datetime.datetime(*[int(v) for v in last_date.replace('T', '-').replace(':', '-').split('-')])
        if ini_bool or last_bool:
            if ini_bool and last_bool:
                qs = qs.filter(fecha__range=(ini_bool, last_bool))
            elif ini_bool and not last_bool:
                qs = qs.filter(fecha__gte=ini_date)
            elif not ini_bool and last_bool:
                qs = qs.filter(fecha__lte=last_date)
        search = self.request.GET.get('search', None)
        if search is not None and search != "":
            if re.match(r'[0-9]+', search, re.M | re.I):
                qs = qs.filter(id__qo=search)
        return qs

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        client_data = request.data['cliente']
        if client_data['contact_2'] == "":
            del client_data['contact_2']
        client_id = client_data.pop('id', None)
        if client_id is not None:
            client = get_object_or_None(Cliente, pk=client_id)
            if client is None:
                return Response({'error': ['Hubo un error al guardar, ingrese nuevamente']},
                                status=status.HTTP_400_BAD_REQUEST)
            clientSerializer = ClienteSerializer(instance=client, data=client_data, context={'request': request})
            clientSerializer.is_valid(raise_exception=True)
            clientSerializer.save()
        else:
            clientSerializer = ClienteSerializer(data=client_data, context={'request': request})
            clientSerializer.is_valid(raise_exception=True)
            clientSerializer.save()
        inventario_id = request.data['inventario']
        inventario = get_object_or_None(Inventario, pk=inventario_id)
        if inventario is None:
            return Response({'error': ['Hubo un error al guardar, ingrese la información nuevamente']},
                            status=status.HTTP_400_BAD_REQUEST)
        inventarioSerialier = InventarioSerializer(instance=inventario, data={'ventas': 1}, partial=True)
        inventarioSerialier.is_valid(raise_exception=True)
        inventarioSerialier.save()
        discount = request.data['discount'] if request.data['discount'] != '' else 0
        aroSerializer = AroOrdenSerializer(
            data={'total': request.data['total'], 'observaciones': request.data['observaciones'],
                  'entrega': datetime.datetime(
                      *[int(v) for v in request.data['entrega'].replace('T', '-').replace(':', '-').split('-')]),
                  'discount': discount, 'inventario': inventarioSerialier.instance.id,
                  'cliente': clientSerializer.instance.id},
            context={'request': request})
        aroSerializer.is_valid(raise_exception=True)
        aroSerializer.save()
        abono_value = request.data['payment']
        if abono_value != '' or abono_value != 0:
            abono = Abono_Aro(pago=abono_value, orden=aroSerializer.instance, tipo=request.data['payform'])
            abono.save()
        return Response({'orden': aroSerializer.data}, status=status.HTTP_201_CREATED)


class CompletaOrdenViewSet(DefaultsMixin, DefaultModelViewSet):
    serializer_class = CompletaOrdenSerializer
    pagination_class = DefaultPagination
    lookup_field = 'uuid'

    def get_queryset(self):
        qs = Completa_Orden.objects.all().order_by('id', 'fecha').filter(status__lt = 4)
        ini_date = self.request.GET.get('ini_date', None)
        last_date = self.request.GET.get('last_date', None)
        ini_bool = ini_date is not None and ini_date != ""
        last_bool = last_date is not None and last_date != ""
        if ini_bool or last_bool:
            if ini_bool and last_bool:
                qs = qs.filter(fecha__range=(ini_bool, last_bool))
            elif ini_bool and not last_bool:
                qs = qs.filter(fecha__gte=ini_date)
            elif not ini_bool and last_bool:
                qs = qs.filter(fecha__lte=last_date)
        search = self.request.GET.get('search', None)
        if search is not None and search != "":
            if re.match(r'[0-9]+', search, re.M | re.I):
                qs = qs.filter(id__qo=search)
        return qs

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        client_data = request.data['cliente']
        if client_data['contact_2'] == "":
            del client_data['contact_2']
        client_id = client_data.pop('id', None)
        if client_id is not None:
            client = get_object_or_None(Cliente, pk=client_id)
            if client is None:
                return Response({'error': ['Hubo un error al guardar, ingrese nuevamente']},
                                status=status.HTTP_400_BAD_REQUEST)
            clientSerializer = ClienteSerializer(instance=client, data=client_data, context={'request': request})
            clientSerializer.is_valid(raise_exception=True)
            clientSerializer.save()
        else:
            clientSerializer = ClienteSerializer(data=client_data, context={'request': request})
            clientSerializer.is_valid(raise_exception=True)
            clientSerializer.save()
        inventario_id = request.data['inventario']
        inventario = get_object_or_None(Inventario, pk=inventario_id)
        if inventario is None:
            return Response({'error': ['Hubo un error al guardar, ingrese la información nuevamente']},
                            status=status.HTTP_400_BAD_REQUEST)
        inventarioSerialier = InventarioSerializer(instance=inventario, data={'ventas': 1}, partial=True)
        inventarioSerialier.is_valid(raise_exception=True)
        inventarioSerialier.save()
        lente = request.data['lente']
        lente_object = get_object_or_None(Lente, pk=lente.get('lente', -1))
        payform = request.data['payform']
        payment = request.data['payment']
        if lente_object is None:
            return Response({'error': ['Hubo un error al guardar, ingrese la información nuevamente']},
                            status=status.HTTP_400_BAD_REQUEST)
        discount = request.data['discount'] if request.data['discount'] != '' else 0
        completaSerializer = CompletaOrdenSerializer(data={'total': request.data['total'], 'lente': lente_object.id,
                                                           'entrega': datetime.datetime.utcfromtimestamp(int(request.data['entrega']/1000)),
                                                           'discount': discount,
                                                           'inventario': inventarioSerialier.instance.id,
                                                           'cliente': clientSerializer.instance.id,
                                                           'ventalente': lente.get('costo', -1),
                                                           'observaciones': request.data['observaciones'],
                                                           'usuario':request.user.id},
                                                     context={'request': request})
        completaSerializer.is_valid(raise_exception=False)
        print(completaSerializer.errors)
        completaSerializer.save()
        #guardar refracciones
        ref1 = save_refraccion(request.data['refraccion'], cliente=clientSerializer.instance,
                               propia=request.data['refraccion'].get('propio', True))
        save_refraccion(request.data['refraccion_2'], cliente=clientSerializer.instance,
                        propia=request.data['refraccion'].get('propio', True), orden=completaSerializer.instance.id)
        #agregas pagos y filtros
        if (payform != '' and payform != '0') and (payment != '0' and payment != ''):
            abono = Abono_Completa(pago=payment, orden=completaSerializer.instance, tipo=payform)
            abono.save()
        filtros = lente['filtros']
        for i in filtros:
            filter = get_object_or_None(Filtro, pk=i)
            if filter is None:
                return Response({'error': ['Hubo un error al guardar, ingrese la información nuevamente']},
                                status=status.HTTP_400_BAD_REQUEST)
            completaSerializer.instance.filtros.add(filter)
        parseDataToOrder(completaSerializer.instance, ref1)
        return completa_pdf(parseDataToOrder(completaSerializer.instance, ref1))

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        datos = dict(serializer.data)
        for x in ['id','filtros','lente','inventario','uri','client','fecha','entrega','abonos','status']:
            datos.pop(x,None)
        filtros = instance.filtros.all()
        datos['id'] = "{:06.0f}".format(instance.id)
        datos['status'] = order_status(instance.status)
        abonos = []
        abonado = 0
        import locale
        locale.setlocale(locale.LC_ALL, 'es_GT.utf8')
        for pay in  instance.abonos_completa.all():
            abonos.append([pay.id,"Q. {} pagado con {} el {}".format(pay.pago,payment_type(pay.tipo),pay.fecha.strftime("%A, %d de %B de %Y").title()),pay.active])
            if pay.active:
                abonado += pay.pago
        datos['abonos'] = abonos
        datos['cliente'] = "{} {}".format(instance.cliente.firstname,instance.cliente.lastname)
        datos['lente'] = "{} - {} - {}".format(instance.lente.color, instance.lente.tipo,instance.lente.material)
        datos['aro'] = "{} / {} / {}".format(instance.inventario.aro.marca.name,instance.inventario.aro.color,instance.inventario.aro.modelo)
        datos['filtros'] = []
        datos['fecha'] = instance.fecha.strftime("%A, %d de %B de %Y").title()
        datos['abonado'] = abonado
        datos['entrega'] = instance.entrega.strftime("%A, %d de %B de %Y hora: %I:%M%p").title()
        for i in filtros:
            datos['filtros'].append(i.filtro)
        return Response(datos)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        if getattr(instance, '_prefetched_objects_cache', None):
            # If 'prefetch_related' has been applied to a queryset, we need to
            # forcibly invalidate the prefetch cache on the instance.
            instance._prefetched_objects_cache = {}

        return Response(serializer.data)

    def get_serializer_class(self):
        if self.request.method == 'GET':
            return CompletaOrdenInfoSerializer
        return CompletaOrdenSerializer

    @action(methods=['post','delete'], detail=True,permission_classes=[permissions.DjangoModelPermissions])
    def save_abono(self, request, uuid=None):
        orden = self.get_object()
        if request.method == 'DELETE':
            body_unicode = request.body
            body = json.loads(body_unicode)
            print(body)
            abono = orden.abonos_completa.all().filter(pk=body.get('id'))
            if(len(abono) != 1):
                return Response(status=status.HTTP_400_BAD_REQUEST)
            orden.notas = orden.notas + "ABONO CANCELADO: {} RAZÓN: {} || ".format(
                "Q.{} / {}  / {}".format(abono[0].pago, payment_type(abono[0].tipo),
                                         abono[0].fecha.strftime("%d-%m-%Y").title()), body.get('nota'))
            orden.save()
            abono[0].active = False
            abono[0].save()
            return Response({'id':abono[0].id,'abono':abono[0].pago},status=status.HTTP_200_OK)
        if request.method == 'POST':
            body_unicode = request.body
            body = json.loads(body_unicode)
            return Response({'abondancieri': 'El pato'})
        return Response(status=status.HTTP_400_BAD_REQUEST)

    @action(methods=['get'], detail=True, permission_classes=[permissions.DjangoModelPermissions])
    def print_pdf(self,request,uuid=None):
        if request.method == 'GET':
            orden = self.get_object()
            ref = orden.cliente.refraction.all().filter(fecha=orden.fecha,orden=orden.id)
            print('----------------------------')
            print(ref.first())
            print(orden)
            print('---------***--***-----------')
            refSerializer = RefractionSerializer(instance = ref.first())
            return completa_pdf(parseDataToOrder(orden,refSerializer))
        return Response(status=status.HTTP_400_BAD_REQUEST)

def parse_to_server(data):
    datos = {'ASC-OD-FAR': {'eje': data.get('ejeODF', 0), 'cilindro': data.get('cilODF', 0),
                            'esfera': data.get('esfODF', 0)},
             'ASC-OI-FAR': {'eje': data.get('ejeOSF', 0), 'cilindro': data.get('cilOSF', 0),
                            'esfera': data.get('esfOSF', 0)},
             'ASC-OD-CLOSE': {'eje': data.get('ejeODC', 0), 'cilindro': data.get('cilODC', 0),
                              'esfera': data.get('esfODC', 0)},
             'ASC-OI-CLOSE': {'eje': data.get('ejeOSC', 0), 'cilindro': data.get('cilOSC', 0),
                              'esfera': data.get('esfOSC', 0)},
             'PRISMA-ADD-OD': {'prisma': data.get('prismaOD', 0), 'base': data.get('tipoprismaOD', 0),
                               'add': data.get('addOD', 0)},
             'PRISMA-ADD-OS': {'prisma': data.get('prismaOS', 0), 'base': data.get('tipoprismaOS', 0),
                               'add': data.get('addOI', 0)},
             'dp-lejos-cerca': {'dp-lejos': data.get('distL', 0), 'dp-cerca': data.get('distC', 0)},
             'observaciones': data.get('observaciones', '')}

    return datos


@api_view(['GET', 'PUT', 'DELETE'])
def refraction_detail(request, pk):
    """
    Retrieve, update or delete a code snippet.
    """
    try:
        refraction = Refraction.objects.get(pk=pk)
    except Refraction.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = RefractionSerializer(refraction)
        return Response(parse_to_server(serializer.data))

    elif request.method == 'PUT':
        serializer = RefractionSerializer(refraction, data=parse_refraccion(request.data, cliente=refraction.cliente,
                                                                            propia=refraction.propia))
        if serializer.is_valid():
            serializer.save()
            return Response({'obs':serializer.data['observaciones']})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        refraction.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
