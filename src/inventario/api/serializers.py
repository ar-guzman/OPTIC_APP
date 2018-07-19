from rest_framework import serializers

from ..utils import get_count_digits
from ..models import Proveedor, Marca, Optica, Aro, Inventario, Laboratorio, Lente, Filtro


class ProveedorSerializer(serializers.ModelSerializer):
    uri = serializers.HyperlinkedIdentityField(
        view_name='proveedor-detail',
        lookup_field='uuid'
    )

    class Meta:
        model = Proveedor
        fields = ('id', 'name', 'direction', 'contact_1', 'contact_2', 'uri',)
        extra_kwargs = {"name": {"error_messages": {"unique": "Este nombre ya está en uso."}}}
        read_only = ['uri']

    def __init__(self, *args, **kwargs):
        super(ProveedorSerializer, self).__init__(*args, **kwargs)
        request = kwargs['context']['request']
        partial = 'partial' in request.GET
        if partial:
            for k in list(self.fields.keys()):
                if k != 'id' and k != 'name':
                    self.fields.pop(k)

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
        representation = super(ProveedorSerializer, self).to_representation(instance)
        if len(representation) > 2:
            return representation

        id = representation.pop('id')
        name = representation.pop('name')

        repackage = {id: name}

        return repackage


class MarcaSerializer(serializers.ModelSerializer):
    uri = serializers.HyperlinkedIdentityField(
        view_name='marca-detail',
        lookup_field='uuid'
    )

    class Meta:
        model = Marca
        fields = ('id', 'uri', 'name', 'description', 'proveedor',)
        read_only = ['uri']
        validators = [
            serializers.UniqueTogetherValidator(
                queryset=model.objects.all(),
                fields=('name', 'proveedor'),
                message="Ya existe este nombre asociado con este proveedor"
            ),
        ]

    def __init__(self, *args, **kwargs):
        super(MarcaSerializer, self).__init__(*args, **kwargs)
        request = kwargs['context']['request']
        partial = 'partial' in request.GET
        if partial:
            for k in list(self.fields.keys()):
                if k != 'id' and k != 'name' and k != 'proveedor':
                    self.fields.pop(k)

    def validate_name(self, value):
        return value.title()

    def to_representation(self, instance):
        representation = super(MarcaSerializer, self).to_representation(instance)

        if len(representation) > 3:
            return representation

        id = representation.pop('id')
        name = representation.pop('name')
        proveedor = representation.pop('proveedor')

        return {id: [name, proveedor]}


class AroSerializer(serializers.ModelSerializer):
    uri = serializers.HyperlinkedIdentityField(
        view_name='aro-detail',
        lookup_field='uuid'
    )

    class Meta:
        model = Aro
        fields = ('id', 'uri', 'modelo', 'color', 'marca')
        read_only = ['uri']
        validators = [serializers.UniqueTogetherValidator(
            queryset=model.objects.all(),
            fields=('color', 'modelo', 'marca'),
            message="Ya existe un aro de dicha marca registrado con esos datos"
        )
        ]

    def __init__(self, *args, **kwargs):
        super(AroSerializer, self).__init__(*args, **kwargs)
        request = kwargs['context']['request']
        partial = 'partial' in request.GET
        if partial:
            for k in list(self.fields.keys()):
                if k != 'id' and k != 'modelo' and k != 'color':
                    self.fields.pop(k)

    def validate_modelo(self, val):
        return val.upper()

    def validate_color(self, val):
        return val.upper()

    def to_representation(self, instance):
        representation = super(AroSerializer, self).to_representation(instance)

        if len(representation) > 3:
            return representation

        id = representation.pop('id')
        color = representation.pop('color')
        modelo = representation.pop('modelo')

        return {id: "{} / {}".format(color, modelo)}


class OpticaSerializer(serializers.ModelSerializer):
    uri = serializers.HyperlinkedIdentityField(
        view_name='optica-detail',
        lookup_field='uuid'
    )

    def __init__(self, *args, **kwargs):
        super(OpticaSerializer, self).__init__(*args, **kwargs)
        request = kwargs['context']['request']
        partial = 'partial' in request.GET
        if partial:
            for k in list(self.fields.keys()):
                if k != 'id' and k != 'name':
                    self.fields.pop(k)

    class Meta:
        model = Optica
        fields = ('id', 'uri', 'name', 'direction', 'contact_1', 'contact_2', 'email')
        read_only = ['uri']
        validators = [
            serializers.UniqueTogetherValidator(
                queryset=model.objects.all(),
                fields=('name', 'direction'),
                message="Esa sucursal ya fue registrada"
            ),
        ]

    def validate_name(self, value):
        return value.title()

    def to_representation(self, instance):
        representation = super(OpticaSerializer, self).to_representation(instance)
        if len(representation) > 2:
            return representation

        id = representation.pop('id')
        name = representation.pop('name')

        repackage = {id: name}

        return repackage


class InventarioSerializer(serializers.ModelSerializer):
    uri = serializers.HyperlinkedIdentityField(
        view_name='inventario-detail',
        lookup_field='uuid'
    )

    class Meta:
        model = Inventario
        fields = ('id', 'uri', 'aro', 'optica', 'fecha', 'costo', 'disponibles', 'perdidas', 'ventas')
        read_only = ['uri', 'perdidas', 'ventas']

    def validate_perdidas(self, value):
        if not self.instance:
            return 0
        if value < 0:
            raise serializers.ValidationError('La cantidad de pérdidas a registrar no puede ser negativa')
        if value <= self.instance.disponibles:
            return value
        else:
            raise serializers.ValidationError(
                'Cantidad en lote no permite registrar esa cantidad de perdidas, revisar.')

    def validate_costo(self, value):
        if value <= 0:
            raise serializers.ValidationError('El costo del aro de este lote debe tener algún valor ingresado')
        return value

    def validate_ventas(self, value):
        print(self.initial_data)
        if not self.instance:
            return 0
        if value < -1 or (value == 0 and self.initial_data['perdidas'] == 0):
            raise serializers.ValidationError('Para registrar la venta no puede utilizar un número negativo')
        if self.instance.disponibles >= 1:
            return value
        else:
            raise serializers.ValidationError('Cantidad en lote no permite registrar esa cantidad de ventas, revisar.')

    def validate_disponibles(self, value):
        if not self.instance:
            return value
        if value > self.instance.disponibles:
            raise serializers.ValidationError(
                'La cantidad del lote sólo puede disminuirse, para aumentar agregue un nuevo lote')
        if value == 0 and self.instance.ventas == 0 and self.instance.perdidas == 0:
            raise serializers.ValidationError('Para reducir la cantidad de este lote a 0 se debe eliminar')

    def update(self, instance, validated_data):
        instance.costo = validated_data.get('costo', instance.costo)
        if 'perdidas' in validated_data and validated_data.get('perdidas') > 0:
            instance.disponibles = instance.disponibles - validated_data.get('perdidas', 0)
            instance.perdidas = instance.perdidas + validated_data.get('perdidas', 0)
            instance.save()
            return instance
        if 'ventas' in validated_data and validated_data.get('ventas') > 0:
            instance.disponibles = instance.disponibles - 1
            instance.ventas = instance.ventas + 1
            instance.save()
            return instance
        elif 'ventas' in validated_data and validated_data.get('ventas') > -1 and instance.ventas > 1:
            instance.disponibles = instance.disponibles + 1
            instance.ventas = instance.ventas - 1
            instance.save()
            return instance
        instance.disponibles = validated_data.get('disponibles', instance.disponibles)
        instance.save()
        return instance


class InventarioBaseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Inventario
        fields = ('id', 'aro', 'optica','costo')

    def to_representation(self, instance):

        representation = super(InventarioBaseSerializer, self).to_representation(instance)

        aromc = '{}-{}'.format(instance.aro.modelo, instance.aro.color)
        invid = representation.pop('id')
        marca = instance.aro.marca.name
        costo = (int((float(representation.pop('costo')) * 2.5)/50) + 1) * 50

        request = self.context['request']

        if 'marca' in request.query_params:
            return { invid : [aromc,costo] }

        return { instance.aro.marca.pk: marca }


class LaboratorioSerializer(serializers.ModelSerializer):
    uri = serializers.HyperlinkedIdentityField(
        view_name='laboratorio-detail',
        lookup_field='uuid'
    )

    class Meta:
        model = Laboratorio
        fields = ('id', 'uri', 'name', 'direction', 'contact_1', 'contact_2')
        read_only = ['uri', 'perdidas', 'ventas']

    def __init__(self, *args, **kwargs):
        super(LaboratorioSerializer, self).__init__(*args, **kwargs)
        request = kwargs['context']['request']
        partial = 'partial' in request.GET
        if partial:
            for k in list(self.fields.keys()):
                if k != 'id' and k != 'name':
                    self.fields.pop(k)

    def validate_contact_1(self, value):
        if get_count_digits(value) != 8:
            raise serializers.ValidationError('Debe ingresar un número de teléfono válido.')
        return value

    def validate_contact_2(self, value):
        if value is not None:
            if get_count_digits(value) != 8:
                raise serializers.ValidationError('Debe ingresar un número de teléfono válido.')
        return value

    def validate_name(self, value):
        return value.title()


class FiltroSerializer(serializers.ModelSerializer):
    uri = serializers.HyperlinkedIdentityField(
        view_name='filtro-detail',
        lookup_field='uuid'
    )

    class Meta:
        model = Filtro
        fields = ('id', 'uri', 'filtro', 'description')

    def __init__(self, *args, **kwargs):
        super(FiltroSerializer, self).__init__(*args, **kwargs)
        request = kwargs['context']['request']
        partial = 'partial' in request.GET
        if partial:
            for k in list(self.fields.keys()):
                if k != 'id' and k != 'filtro':
                    self.fields.pop(k)

    def to_representation(self, instance):
        representation = super(FiltroSerializer, self).to_representation(instance)
        if len(representation) > 2:
            return representation

        id = representation.pop('id')
        name = representation.pop('filtro')

        repackage = {id: name}

        return repackage


class LenteSerializer(serializers.ModelSerializer):
    uri = serializers.HyperlinkedIdentityField(
        view_name='lente-detail',
        lookup_field='uuid'
    )

    class Meta:
        model = Lente
        fields = ('id', 'uri', 'material', 'tipo', 'color', 'filtro')
        read_only = ['id', 'uri']

    def __init__(self, *args, **kwargs):
        super(LenteSerializer, self).__init__(*args, **kwargs)
        request = kwargs['context']['request']
        partial = 'partial' in request.GET
        if partial:
            for k in list(self.fields.keys()):
                if k == 'uri':
                    self.fields.pop(k)

    def to_representation(self, instance):
        representation = super(LenteSerializer, self).to_representation(instance)
        if len(representation) > 5:
            return representation

        id = representation.pop('id')
        material = representation.pop('material')
        color = representation.pop('color')
        tipo = representation.pop('tipo')
        filtros = representation.pop('filtro')
        return {id: [tipo,material,color,filtros]}

    def create(self, validated_data):
        filters = validated_data.pop('filtro')
        lente = Lente.objects.create(**validated_data)
        for filtro in filters:
            if filtro is not None:
                lente.filtro.add(filtro)
        lente.save()
        return lente

    def update(self, instance, validated_data):
        instance.color = validated_data.get('color', instance.color)
        instance.material = validated_data.get('material', instance.material)
        instance.tipo = validated_data.get('tipo', instance.tipo)
        old_vals = set(instance.filtro.all()) - set(validated_data['filtro'])
        for filtros in old_vals:
            instance.filtro.remove(filtros)
        for filtros in validated_data.get('filtro', []):
            instance.filtro.add(filtros)
        instance.save()
        return instance
