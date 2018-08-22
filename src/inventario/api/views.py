import re
from uuid import UUID

from django.core.paginator import InvalidPage
from django.db.models import Q
from django.utils import six
from rest_framework_simplejwt import authentication as authenticationjwt
from rest_framework import authentication, permissions, status
from rest_framework.exceptions import NotFound
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet
from rest_framework.pagination import PageNumberPagination

from ..models import Proveedor, Marca, Aro, Optica, Inventario, Laboratorio, Lente, Filtro
from .serializers import ProveedorSerializer, MarcaSerializer, AroSerializer, OpticaSerializer, InventarioSerializer, \
    LaboratorioSerializer, LenteSerializer, FiltroSerializer, InventarioBaseSerializer

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


class ProveedorViewSet(DefaultsMixin, DefaultModelViewSet):
    serializer_class = ProveedorSerializer
    pagination_class = DefaultPagination
    lookup_field = 'uuid'

    def get_queryset(self):
        qs = Proveedor.objects.all().order_by('id')
        search = self.request.GET.get('search', None)
        if search is not None and search!="":
            # Cuando hay una búsqueda verificamos si hay texto o sólo son números,
            # en base a eso se hará la consulta.
            if re.match(r'[0-9]+', search, re.M | re.I):
                divisor = int(search) if int(search) > 0 else 1
                qs = qs.filter(Q(contact_1__qo=divisor) |
                               Q(contact_2__qo=divisor))
            else:
                qs = qs.filter(Q(name__contains=search) |
                               Q(direction__contains=search) |
                               Q(name__iexact=search) |
                               Q(direction__iexact=search)
                               )
        return qs

    def retrieve(self, request, *args, **kwargs):
        try:
            UUID(kwargs.get('uuid', '0'), version=4)
            instance = self.get_object()
            serializer = self.get_serializer(instance)
            return Response(serializer.data)
        except ValueError:
            self.lookup_field = 'pk'
            self.kwargs['pk'] = self.kwargs.pop('uuid')
            instance = self.get_object()
            serializer = self.get_serializer(instance)
            return Response(serializer.data)


class MarcaViewSet(DefaultsMixin, DefaultModelViewSet):
    serializer_class = MarcaSerializer
    pagination_class = DefaultPagination
    lookup_field = 'uuid'

    def get_queryset(self):
        qs = Marca.objects.all().order_by('id')
        search = self.request.GET.get('search', None)
        proveedor = self.request.GET.get('proveedor', None)
        if search is not None and search != "":
            qs = qs.filter(Q(name__icontains=search) |
                           Q(description__icontains=search) |
                           Q(proveedor__name__icontains=search))
        if proveedor is not None and proveedor != '0':
            qs = qs.filter(Q(proveedor__id=proveedor))
        return qs

    def retrieve(self, request, *args, **kwargs):
        try:
            UUID(kwargs.get('uuid', '0'), version=4)
            instance = self.get_object()
            serializer = self.get_serializer(instance)
            return Response(serializer.data)
        except ValueError:
            self.lookup_field = 'pk'
            self.kwargs['pk'] = self.kwargs.pop('uuid')
            instance = self.get_object()
            serializer = self.get_serializer(instance)
            return Response(serializer.data)

class AroViewSet(DefaultsMixin, DefaultModelViewSet):
    serializer_class = AroSerializer
    pagination_class = DefaultPagination
    lookup_field = 'uuid'

    def get_queryset(self):
        qs = Aro.objects.all().order_by('id')
        search = self.request.GET.get('search',None)
        marca  = self.request.GET.get('marca',None)
        if search is not None:
            qs = qs.filter(Q(modelo__icontains=search) |
                           Q(color__icontains=search) |
                           Q(marca__name__icontains=search))
        if marca is not None and marca != "":
            qs = qs.filter(Q(marca__id__exact = marca))
        return qs

class OpticaViewSet(DefaultsMixin, DefaultModelViewSet):
    serializer_class = OpticaSerializer
    pagination_class = DefaultPagination
    lookup_field = 'uuid'


    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        data = serializer.data
        data['photo'] = instance.photo.url
        return Response(data)

    def get_queryset(self):
        qs = Optica.objects.all().order_by('id')
        search = self.request.GET.get('search',None)
        if search is not None:
            qs = qs.filter(Q(name__icontains=search) |
                           Q(description__icontains=search))
        return qs

class InventarioViewSet(DefaultsMixin,DefaultModelViewSet):
    serializer_class = InventarioSerializer
    pagination_class = DefaultPagination
    lookup_field = 'uuid'

    def get_queryset(self):
        orden = self.request.GET.get('orden',False)
        optica = self.request.GET.get('optica', None)
        if orden:
            marca = self.request.query_params.get('marca',None)
            qs = Inventario.objects.all().order_by('optica','aro','fecha')\
                .filter(disponibles__gt = 0).distinct('optica','aro')#.values_list('id','optica','aro')
            if optica is not None and optica != "0" and optica !="":
                qs = qs.filter(optica__id__iexact=optica)
            if marca is not None and marca != "" and marca != "0":
                qs = qs.filter(aro__marca__id__iexact = marca)
            return qs
        qs = Inventario.objects.all().order_by('fecha')
        search = self.request.GET.get('search', None)
        aro = self.request.GET.get('aro',None)
        fecha = self.request.GET.get('fecha',None)
        if search is not None and search != "":
            qs = qs.filter(Q(aro__modelo=search)|Q(aro__color=search)|
                           Q(aro__marca__name__icontains=search))
        if optica is not None and optica != "0" and optica !="":
            qs = qs.filter(optica__id__iexact=optica)
        if aro is not None and aro != "" and aro !="0":
            qs = qs.filter(aro__id__iexact=aro)
        if fecha is not None and fecha != "":
            qs = qs.filter(fecha__exact=fecha)
        return qs

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.ventas != 0 or instance.perdidas != 0:
            return Response({'delete_error':['No es posible eliminar una entrada con ventas y perdidas ya asignadas']},
                            status=status.HTTP_403_FORBIDDEN)
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)

    def get_serializer_class(self):
        if self.request.method == 'GET':
            if self.request.GET.get('orden',False):
                return InventarioBaseSerializer
        return InventarioSerializer

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



class LaboratorioViewSet(DefaultsMixin,DefaultModelViewSet):
    serializer_class = LaboratorioSerializer
    pagination_class = DefaultPagination
    lookup_field = 'uuid'

    def get_queryset(self):
        qs = Laboratorio.objects.all().order_by('id')
        search = self.request.GET.get('search', None)
        if search is not None:
            # Cuando hay una búsqueda verificamos si hay texto o sólo son números,
            # en base a eso se hará la consulta.
            if re.match(r'[0-9]+', search, re.M | re.I):
                divisor = int(search) if int(search) > 0 else 1
                qs = qs.filter(Q(contact_1__qo=divisor) |
                               Q(contact_2__qo=divisor))
            else:
                qs = qs.filter(Q(name__contains=search) |
                               Q(direction__contains=search) |
                               Q(name__iexact=search) |
                               Q(direction__iexact=search)
                               )
        return qs

class LenteViewSet(DefaultsMixin,DefaultModelViewSet):
    serializer_class = LenteSerializer
    pagination_class = DefaultPagination
    lookup_field = 'uuid'

    def get_queryset(self):
        qs = Lente.objects.all().order_by('id')
        search = self.request.GET.get('search', None)
        filtro = self.request.GET.get('filtro', None)
        if filtro is not None and filtro != "":
            qs = qs.filter(filtro__pk = filtro)
        if search is not None and search != "":
            qs = qs.filter(Q(material__icontains = search) | Q(tipo__icontains = search)
                           | Q(tipo__icontains=search))

        return qs

    def list(self,request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(queryset, many=True)
        if 'partial' in request.query_params:
            return Response({'results': serializer.data})
        return self.get_full_response(serializer.data)

class FiltroViewSet(DefaultsMixin,DefaultModelViewSet):
    serializer_class = FiltroSerializer
    pagination_class = DefaultPagination
    lookup_field = 'uuid'

    def get_queryset(self):
        qs = Filtro.objects.all().order_by('id')
        search = self.request.GET.get('search', None)
        if search is not None and search != "":
            qs = qs.filter(Q(filtro__icontains = search)
                           | Q(description__icontains = search))
        return qs


