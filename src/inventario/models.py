import uuid as uuid_lib

from django.core.validators import RegexValidator
from django.db import models
from django.db.models import Lookup, Field
from .utils import get_count_digits

class Optica(models.Model):
    """
    Modelo que guarda la información de la óptica:
    nombre, dirección y teléfonos de contacto
    """
    name = models.CharField(max_length=123, db_column="name")
    direction = models.CharField(max_length=255,db_column="direction")
    contact_1 = models.PositiveIntegerField(blank=False, db_column="contact_1")
    contact_2 = models.PositiveIntegerField(null=True, db_column="contact_2")
    email = models.EmailField(db_column="email",blank=True,default="correo@correo.com")
    uuid = models.UUIDField(    #usado por el api para buscar el registro
        db_index=True,
        default=uuid_lib.uuid4,
        editable=False )

    def save(self, *args, **kwargs):
        self.name = self.name.title()
        super(Optica, self).save(*args, **kwargs)

    class Meta:
        unique_together = ('name','direction')

class Proveedor(models.Model):
    """
    Modelo que guarda la información del proveedor:
    nombre, dirección y números de contactos.
    """
    name = models.CharField(max_length=123,
                                unique=True,
                                error_messages={'unique':'Este nombre ya se encuentra asignado a otro proveedor.'},
                                db_column="name"
                                )
    direction = models.CharField(max_length=255, blank=True, db_column="direction")
    contact_1 = models.PositiveIntegerField(blank=False, db_column="contact_number_1")
    contact_2 = models.PositiveIntegerField(null=True, db_column="contact_number_2")
    uuid = models.UUIDField(    #usado por el api para buscar el registro
        db_index=True,
        default=uuid_lib.uuid4,
        editable=False )

    def save(self, *args, **kwargs):
        self.name = self.name.title()
        super(Proveedor, self).save(*args, **kwargs)

class Marca(models.Model):
    """
    Modelo que guarda la información de las marcas:
    proveedor, descripción y nombre
    """
    name = models.CharField(max_length=63,db_column="name")
    description = models.CharField(max_length=123,db_column="description",blank=True)
    proveedor = models.ForeignKey('Proveedor', null=True,
                                         on_delete = models.SET_NULL,
                                         db_column="proveedor")
    uuid = models.UUIDField(    #usado por el api para buscar el registro
        db_index=True,
        default=uuid_lib.uuid4,
        editable=False)

    def save(self, *args, **kwargs):
        self.name = self.name.title()
        super(Marca, self).save(*args, **kwargs)

    class Meta:
        unique_together = ('name', 'proveedor',)


class Aro(models.Model):
    modelo = models.CharField(max_length=123, validators=[
        RegexValidator(
            regex="^[0-9A-Za-z\#_\-\s]+$",
            message='Patrón inválido, sólo se aceptan letras, números, _, # y -'
        )
    ])
    marca = models.ForeignKey('Marca',related_name='aros',null=True,
                               on_delete = models.PROTECT)
    uuid = models.UUIDField(
        db_index = True,
        default  = uuid_lib.uuid4,
        editable = False
    )
    color = models.CharField(max_length=31, validators=[
        RegexValidator(
            regex="^[0-9A-Za-z\#_\-\s]+$",
            message='Patrón inválido, sólo se aceptan letras, números,espacios, _, # y -'
        )
    ])

    def save(self,*args,**kwargs):
        self.modelo = self.modelo.upper()
        self.color  = self.color.upper()
        super(Aro, self).save(*args, **kwargs)

    class Meta:
        unique_together = ('modelo','marca','color')

class Inventario(models.Model):
    aro = models.ForeignKey('Aro',
                            on_delete=models.PROTECT)
    optica = models.ForeignKey('Optica',
                               on_delete=models.PROTECT)
    fecha = models.DateField(auto_now=True,editable=False)
    costo = models.DecimalField(max_digits=8,decimal_places=2)
    disponibles = models.PositiveSmallIntegerField()
    perdidas = models.SmallIntegerField(default=0)
    ventas = models.SmallIntegerField(default=0)
    uuid = models.UUIDField(    #usado por el api para buscar el registro
        db_index=True,
        default=uuid_lib.uuid4,
        editable=False
    )

class Laboratorio(models.Model):
    name = models.CharField(db_column='name',
                            unique=True,
                            error_messages={'unique': 'Este nombre ya se encuentra asignado a otro proveedor.'},
                            max_length=123)
    direction = models.CharField(db_column='directions',max_length=255,blank=True)
    contact_1 = models.PositiveIntegerField()
    contact_2 = models.PositiveIntegerField(null=True)
    uuid = models.UUIDField(
        db_index=True,
        default=uuid_lib.uuid4,
        editable=False
    )

    def save(self, *args, **kwargs):
        self.name = self.name.title()
        super(Laboratorio, self).save(*args, **kwargs)

class Filtro(models.Model):
    filtro = models.CharField(max_length=127)
    description = models.CharField(max_length=255,blank=True)
    uuid = models.UUIDField(  # usado por el api para buscar el registro
        db_index=True,
        default=uuid_lib.uuid4,
        editable=False
    )

    def save(self,*args,**kwargs):
        self.filtro = self.filtro.title()
        super(Filtro,self).save(*args, **kwargs)

class Lente(models.Model):
    material = models.CharField(max_length=127)
    tipo = models.CharField(max_length=127)
    filtro = models.ManyToManyField(Filtro,blank=True)
    color = models.CharField(max_length=127)
    uuid = models.UUIDField(  # usado por el api para buscar el registro
        db_index=True,
        default=uuid_lib.uuid4,
        editable=False
    )

    class Meta:
        unique_together = ('material','tipo','color')

    def save(self, *args, **kwargs):
        self.material = self.material.title()
        self.tipo = self.tipo.title()
        self.color = self.color.title()
        super(Lente, self).save(*args, **kwargs)

class Quotient(Lookup):
    lookup_name = 'qo'

    def as_sql(self, compiler, connection):
        lhs, lhs_params = self.process_lhs(compiler, connection)
        rhs, rhs_params = self.process_rhs(compiler, connection)
        div = [pow(10,8 - get_count_digits(int(rhs_params[0])))]
        params = lhs_params + div + rhs_params
        return '{} / {} = {}'.format(lhs,'%s',rhs), params

Field.register_lookup(Quotient)