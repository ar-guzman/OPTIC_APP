from django.db import models
from django.db.models.signals import post_save
from inventario.models import Optica, Inventario, Lente, Filtro
from django.contrib.auth.models import User
import uuid as uuid_lib


# Create your models here.


def user_directory_path(instance, filename):
    return 'user_{0}/{1}'.format(instance.user.id, filename)

class Empleado(models.Model):
    user = models.OneToOneField(User, on_delete=models.PROTECT)
    dpi = models.BigIntegerField(null=True)
    contact = models.PositiveIntegerField(null=True)
    optica = models.ForeignKey(Optica, on_delete=models.PROTECT, null=True)
    photo = models.FileField(verbose_name=('Profile picture'), upload_to=user_directory_path
                             , max_length=255, null=True, blank=True)
    # job_position = models.CharField()
    uuid = models.UUIDField(  # usado por el api para buscar el registro
        db_index=True,
        default=uuid_lib.uuid4,
        editable=False
    )


class Cliente(models.Model):
    firstname = models.CharField(max_length=63)
    lastname = models.CharField(max_length=63)
    contact_1 = models.PositiveIntegerField()
    contact_2 = models.PositiveIntegerField(null=True)
    ocupacion = models.CharField(max_length=127, blank=True, default="")
    uuid = models.UUIDField(
        db_index=True,
        default=uuid_lib.uuid4,
        editable=False
    )

    class Meta:
        unique_together = ('firstname', 'lastname', 'contact_1',)

    def save(self, *args, **kwargs):
        self.firstname = self.firstname.title().strip()
        self.lastname = self.lastname.title().strip()
        super(Cliente, self).save(*args, **kwargs)



class Refraction(models.Model):
    ejeODC = models.SmallIntegerField(default=0)
    ejeOSC = models.SmallIntegerField(default=0)
    ejeODF = models.SmallIntegerField(default=0)
    ejeOSF = models.SmallIntegerField(default=0)
    cilODC = models.DecimalField(max_digits=4,decimal_places=2,default=0)
    cilOSC = models.DecimalField(max_digits=4,decimal_places=2,default=0)
    cilODF = models.DecimalField(max_digits=4,decimal_places=2,default=0)
    cilOSF = models.DecimalField(max_digits=4, decimal_places=2, default=0)
    esfOSF = models.DecimalField(max_digits=4,decimal_places=2,default=0)
    esfODC = models.DecimalField(max_digits=4,decimal_places=2,default=0)
    esfOSC = models.DecimalField(max_digits=4,decimal_places=2,default=0)
    esfODF = models.DecimalField(max_digits=4,decimal_places=2,default=0)
    esfOSF = models.DecimalField(max_digits=4,decimal_places=2,default=0)
    prismaOD = models.DecimalField(max_digits=4,decimal_places=2,default=0)
    tipoprismaOD = models.SmallIntegerField(default=0)
    prismaOS = models.DecimalField(max_digits=4,decimal_places=2,default=0)
    tipoprismaOS = models.SmallIntegerField(default=0)
    addOD = models.DecimalField(max_digits=4,decimal_places=2,default=0)
    addOI = models.DecimalField(max_digits=4,decimal_places=2,default=0)
    distC = models.PositiveSmallIntegerField()
    distL = models.PositiveSmallIntegerField(default=0)
    observaciones = models.CharField(max_length=255, blank=True)
    cliente = models.ForeignKey(Cliente, related_name='refraction', on_delete=models.PROTECT)
    propia = models.BooleanField(default=True)
    fecha = models.DateField(auto_now_add=True)
    orden = models.PositiveIntegerField(default=0)

class Aro_Orden(models.Model):
    """
    STATUS
    "0" Pendiente
    "1" Listo
    "2" Entregado
    "3" Con Problemas
    "4" Cancelado
    PAGOS
    "0" Sin abonar
    "1" Abonado
    "2" Pagado
    """
    usuario = models.ForeignKey(User, on_delete=models.PROTECT)
    inventario = models.ForeignKey(Inventario, on_delete=models.PROTECT)
    cliente = models.ForeignKey(Cliente, on_delete=models.PROTECT)
    total = models.DecimalField(max_digits=9,decimal_places=2,default=0)
    status = models.PositiveSmallIntegerField(default=0)
    pagado = models.PositiveSmallIntegerField(default=0)
    observaciones = models.CharField(max_length=255, blank=True)
    notas = models.CharField(max_length=1023, blank=True)
    fecha = models.DateField(auto_now_add=True)
    offline_id = models.IntegerField(null=True)
    # descuento
    entrega = models.DateTimeField()
    uuid = models.UUIDField(
        db_index=True,
        default=uuid_lib.uuid4,
        editable=False
    )


class Abono_Aro(models.Model):
    """
    tipo
        0 = cheque
        1 = efectivo
        2 = tarjeta
    """
    tipo = models.PositiveSmallIntegerField(default=1)
    pago = models.DecimalField(max_digits=9,decimal_places=2,default=0)
    orden = models.ForeignKey(Aro_Orden, related_name='abonos_aro', on_delete=models.PROTECT)
    fecha = models.DateField(auto_now_add=True)
    active = models.BooleanField(default=True)

class Completa_Orden(models.Model):
    usuario = models.ForeignKey(User,on_delete=models.PROTECT)
    inventario = models.ForeignKey(Inventario, on_delete=models.PROTECT)
    lente = models.ForeignKey(Lente, on_delete=models.PROTECT,related_name='lente')
    cliente = models.ForeignKey(Cliente, on_delete=models.PROTECT)
    filtros = models.ManyToManyField(Filtro, related_name='filtros')
    offline_id = models.IntegerField(null=True)
    ventalente = models.DecimalField(max_digits=9,decimal_places=2,default=0)
    costolente = models.DecimalField(max_digits=9, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=9,decimal_places=2,default=0)
    status = models.PositiveSmallIntegerField(default=0)
    pagado = models.PositiveSmallIntegerField(default=0)
    #discount
    observaciones = models.CharField(max_length=255, blank=True)
    notas = models.CharField(max_length=1023, blank=True)
    fecha = models.DateField(auto_now_add=True)
    entrega = models.DateTimeField()
    uuid = models.UUIDField(
        db_index=True,
        default=uuid_lib.uuid4,
        editable=False
    )

    class  Meta:
        ordering = ['-fecha']


class Abono_Completa(models.Model):
    """
    tipo
        1 = cheque
        2 = efectivo
        3 = tarjeta
    """
    tipo = models.PositiveSmallIntegerField(default=1)
    pago = models.DecimalField(max_digits=9,decimal_places=2,default=0)
    orden = models.ForeignKey(Completa_Orden, related_name='abonos_completa', on_delete=models.PROTECT)
    fecha = models.DateField(auto_now_add=True)
    active = models.BooleanField(default=True)