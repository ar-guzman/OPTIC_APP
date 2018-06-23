from django.contrib.auth.hashers import make_password
from django.contrib.auth.models import User
from rest_framework import serializers

from inventario.utils import get_count_digits
from ..models import Empleado, Cliente, Aro_Orden


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


class Orden_Aro(serializers.ModelSerializer):
    uri = serializers.HyperlinkedIdentityField(
        view_name='ordenaro-detail',
        lookup_field='uuid'
    )

    class Meta:
        model = Aro_Orden
        exclue = ('uuid',)
