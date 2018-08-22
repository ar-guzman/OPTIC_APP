from django.contrib.auth.hashers import make_password
from django.contrib.auth.models import User
from rest_framework import serializers

from inventario.utils import get_count_digits
from ..models import Empleado, Cliente, Aro_Orden, Refraction, Completa_Orden, Lente_Orden


class UserSerializer(serializers.ModelSerializer):

    def __init__(self, *args, **kwargs):
        super(UserSerializer, self).__init__(*args, **kwargs)
        request = kwargs['context']['request']
        if request.method != 'POST':
            self.fields.pop('password')

    class Meta:
        model = User
        fields = ("username", "first_name", "last_name", "email", "password",)
        read_only = ['username', ]
        extra_kwargs = {"username": {"validators":[]}}

    def update(self, instance, validated_data):
        instance.email = validated_data.get('email',instance.email)
        instance.first_name = validated_data.get('first_name',instance.first_name)
        instance.last_name = validated_data.get('last_name', instance.last_name)
        instance.save()
        return instance


class EmpleadoSerializer(serializers.ModelSerializer):

    def __init__(self, *args, **kwargs):
        super(EmpleadoSerializer, self).__init__(*args, **kwargs)
        self.fields['user'] = UserSerializer(many=False, context=self.context)

    uri = serializers.HyperlinkedIdentityField(
        view_name='empleado-detail',
        lookup_field='uuid'
    )

    class Meta:
        model = Empleado
        exclude = ('uuid', 'user')

    def create(self, validated_data):
        user_data = validated_data.pop('user')
        username = user_data.get('username',None)
        password = user_data.pop('password', None)
        if password is None:
            raise Exception({'username': ['Debe añadirse una contraseña']})
        user_data.update({'password': make_password(password)})
        if username is None:
            raise Exception({'username':['Debe darse un nombre de usuario']})
        try:
            user = User.objects.get(username = username)
        except:
            user = None
        if user is None:
            user = User.objects.create(**user_data)
        else:
            raise Exception({'username':['Este nombre de usuario ya es encuentra en uso']})
        empleado = Empleado.objects.create(user = user, **validated_data)
        empleado.save()
        return empleado

    def update(self, instance, validated_data):
        user_data = validated_data.pop('user')
        try:
            user_object = User.objects.get(username = user_data.get('username',None))
        except:
            user_object = None
        if user_object is None:
            raise Exception({'username':['El nombre del usuario no puede ser modificado por ud']})
        user = UserSerializer(user_object, data = user_data, context=self.context)
        user.is_valid(raise_exception=True)
        user.save()
        instance.dpi = validated_data.get('dpi',instance.dpi)
        instance.contact = validated_data.get('contact', instance.contact)
        instance.optica = validated_data.get('optica',None)
        instance.photo = validated_data.get('photo',instance.photo)
        instance.save()
        return instance



class ClienteSerializer(serializers.ModelSerializer):

    uri = serializers.HyperlinkedIdentityField(
        view_name='cliente-detail',
        lookup_field='uuid'
    )

    class Meta:
        model = Cliente
        exclude = ('uuid',)
        validators = [
            serializers.UniqueTogetherValidator(
                queryset=model.objects.all(),
                fields=('firstname', 'lastname','contact_1'),
                message="Este cliente ya existe, por favor vuelva a inspeccionar."
            ),
        ]

    def validate_contact_1(self, value):
        if get_count_digits(value) != 8:
            raise serializers.ValidationError('Debe ingresar un número de teléfono válido.')
        return value

    def validate_contact_2(self, value):
        if value is not None:
            if get_count_digits(value) != 8:
                raise serializers.ValidationError('Debe ingresar un número de teléfono válido.')
        return value

    def to_representation(self, instance):
        representation = super(ClienteSerializer, self).to_representation(instance)
        request = self.context['request']
        if request.method == 'GET' and 'partial' in request.GET:
            for k in list(self.fields.keys()):
                if k not in ['id','firstname','lastname','contact_1']:
                    representation.pop(k)
        return representation



class AroOrdenSerializer(serializers.ModelSerializer):
    uri = serializers.HyperlinkedIdentityField(
        view_name='ordenaro-detail',
        lookup_field='uuid'
    )
    class Meta:
        model = Aro_Orden
        exclude = ('uuid',)

class RefractionSerializer(serializers.ModelSerializer):

    class Meta:
        model = Refraction
        fields = '__all__'

    def validate_ejeODC(self,value):
        if value > 180 or value < 0:
            raise serializers.ValidationError('El valor del eje no puede superar los 180 o ser menor a 0')
        return value

    def validate_ejeOSC(self,value):
        if value > 180 or value < 0:
            raise serializers.ValidationError('El valor del eje no puede superar los 180 o ser menor a 0')
        return value

    def validate_ejeODF(self,value):
        if value > 180 or value < 0:
            raise serializers.ValidationError('El valor del eje no puede superar los 180 o ser menor a 0')
        return value

    def validate_ejeOSF(self,value):
        if value > 180 or value < 0:
            raise serializers.ValidationError('El valor del eje no puede superar los 180 o ser menor a 0')
        return value

    def validate_cilODC(self,value):
        if value > 0:
            raise serializers.ValidationError('El valor del cilindro sólo puede ser negativo.')
        return value

    def validate_cilOSC(self,value):
        if value > 0:
            raise serializers.ValidationError('El valor del cilindro sólo puede ser negativo.')
        return value

    def validate_cilODF(self,value):
        if value > 0:
            raise serializers.ValidationError('El valor del cilindro sólo puede ser negativo.')
        return value

    def validate_cilOSF(self,value):
        if value > 0:
            raise serializers.ValidationError('El valor del cilindro sólo puede ser negativo.')
        return value

    def validate_esfOSF(self,value):
        if value > 20 or value < -20:
            raise serializers.ValidationError('El valor de la esfera debe estar entre ±20')
        return value

    def validate_esfODC(self,value):
        if value > 20 or value < -20:
            raise serializers.ValidationError('El valor de la esfera debe estar entre ±20')
        return value

    def validate_esfOSC(self,value):
        if value > 20 or value < -20:
            raise serializers.ValidationError('El valor de la esfera debe estar entre ±20')
        return value

    def validate_esfODF(self,value):
        if value > 20 or value < -20:
            raise serializers.ValidationError('El valor de la esfera debe estar entre ±20')
        return value

    def validate_esfOSF(self,value):
        if value > 20 or value < -20:
            raise serializers.ValidationError('El valor de la esfera debe estar entre ±20')
        return value


    def validate_prismaOD(self,value):
        if value > 20:
            raise serializers.ValidationError('El valor del prisma debe ser menor a 20')
        return value

    def validate_prismaOS(self,value):
        if value > 20:
            raise serializers.ValidationError('El valor del prisma debe ser menor a 20')
        return value

    def validate_addOD(self,value):
        if value > 20:
            raise serializers.ValidationError('El valor de ADD debe ser menor a 20')
        return value

    def validate_addOI(self,value):
        if value > 20:
            raise serializers.ValidationError('El valor de ADD debe ser menor a 20')
        return value

    def validate_ventalente(self,value):
        if value < 0:
            raise serializers.ValidationError('No puede regalar el lente!!!!')
        return value


class CompletaOrdenSerializer(serializers.ModelSerializer):

    uri = serializers.HyperlinkedIdentityField(
        view_name='ordencompleta-detail',
        lookup_field='uuid'
    )

    class Meta:
        model = Completa_Orden
        exclude = ('uuid','filtros')

class CompletaOrdenInfoSerializer(serializers.ModelSerializer):

    uri = serializers.HyperlinkedIdentityField(
        view_name='ordencompleta-detail',
        lookup_field='uuid'
    )
    cliente = ClienteSerializer(many=False)

    class Meta:
        model = Completa_Orden
        exclude = ('uuid',)

    def to_representation(self, instance):
        representation = super(CompletaOrdenInfoSerializer, self).to_representation(instance)
        abono = 0
        cliente = representation.pop('cliente')
        representation['cliente'] = {'firstname':cliente.pop('firstname'),'lastname':cliente.pop('lastname'),
                                     'uri':cliente.pop('uri')}
        for i in instance.abonos_completa.all():
            abono += i.pago
        representation['abono'] = abono
        return representation

class LenteOrdenSerializer(serializers.ModelSerializer):

    uri = serializers.HyperlinkedIdentityField(
        view_name='ordenlente-detail',
        lookup_field='uuid'
    )

    class Meta:
        model = Lente_Orden
        exclude = ('uuid','filtros')

class LenteOrdenInfoSerializer(serializers.ModelSerializer):

    uri = serializers.HyperlinkedIdentityField(
        view_name='ordenlente-detail',
        lookup_field='uuid'
    )
    cliente = ClienteSerializer(many=False)

    class Meta:
        model = Completa_Orden
        exclude = ('uuid',)

    def to_representation(self, instance):
        representation = super(LenteOrdenInfoSerializer, self).to_representation(instance)
        abono = 0
        cliente = representation.pop('cliente')
        representation['cliente'] = {'firstname':cliente.pop('firstname'),'lastname':cliente.pop('lastname'),
                                     'uri':cliente.pop('uri')}
        for i in instance.abonos_lente.all():
            abono += i.pago
        representation['abono'] = abono
        return representation

class RepairOrdenSerializer(serializers.ModelSerializer):

    uri = serializers.HyperlinkedIdentityField(
        view_name='ordenrepair-detail',
        lookup_field='uuid'
    )

    class Meta:
        model = Lente_Orden
        exclude = ('uuid','filtros')

class RepairOrdenInfoSerializer(serializers.ModelSerializer):

    uri = serializers.HyperlinkedIdentityField(
        view_name='ordenrepair-detail',
        lookup_field='uuid'
    )
    cliente = ClienteSerializer(many=False)

    class Meta:
        model = Completa_Orden
        exclude = ('uuid',)

    def to_representation(self, instance):
        representation = super(RepairOrdenInfoSerializer, self).to_representation(instance)
        abono = 0
        cliente = representation.pop('cliente')
        representation['cliente'] = {'firstname':cliente.pop('firstname'),'lastname':cliente.pop('lastname'),
                                     'uri':cliente.pop('uri')}
        for i in instance.abonos_repair.all():
            abono += i.pago
        representation['abono'] = abono
        return representation