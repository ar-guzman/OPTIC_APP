import re

from django.core.paginator import InvalidPage
from django.utils import six
from rest_framework import permissions, status
from rest_framework_simplejwt import authentication as authenticationjwt

from rest_framework.exceptions import NotFound
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet
from rest_framework.pagination import PageNumberPagination

from ..models import Empleado, Cliente, Aro_Orden
from .serializers import EmpleadoSerializer, ClienteSerializer, Orden_Aro


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
        firstname = self.request.GET.get('firstname',None)
        lastname = self.request.GET.get('lastname', None)
        contact = self.request.GET.get('contact_1', None)
        if firstname is not None and firstname != "":
            qs = qs.filter(firstname__iexact = firstname.strip())
        if lastname is not None and lastname != "":
            qs = qs.filter(lastname__iexact = lastname.strip())
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

class AroOrden(DefaultsMixin, DefaultModelViewSet):
    serializer_class = Orden_Aro
    pagination_class = DefaultPagination
    lookup_field = 'uuid'

    def get_queryset(self):
        qs = Aro_Orden.objects.all().oder_by('id','fecha')
        ini_date = self.request.GET('ini_date',None)
        last_date = self.request.GET('last_date', None)
        ini_bool = ini_date is not None and ini_date != ""
        last_bool = last_date is not None and last_date != ""
        if ini_bool or last_bool:
            if ini_bool and last_bool:
                qs = qs.filter(fecha__range=(ini_bool,last_bool))
            elif ini_bool and not last_bool:
                qs = qs.filter(fecha__gte=ini_date)
            elif not ini_bool and last_bool:
                qs = qs.filter(fecha__lte=last_date)
        search = self.request.GET('search',None)
        if search is not None and  search!= "":
            if re.match(r'[0-9]+', search, re.M | re.I):
                qs = qs.filter(id__qo=search)
        return qs







