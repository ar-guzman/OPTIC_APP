from django.db import models
from inventario.models import Optica, Inventario
from django.contrib.auth.models import User
import uuid as uuid_lib
# Create your models here.



def user_directory_path(instance, filename):
    return 'user_{0}/{1}'.format(instance.user.id, filename)

class Empleado(models.Model):

    user = models.OneToOneField(User,on_delete=models.PROTECT)
    dpi  = models.BigIntegerField(null=True)
    contact = models.PositiveIntegerField(null=True)
    optica = models.ForeignKey(Optica,on_delete=models.PROTECT,null=True)
    photo = models.FileField(verbose_name=('Profile picture'),upload_to=user_directory_path
                                ,max_length=255, null=True, blank=True)
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
    uuid = models.UUIDField(
        db_index=True,
        default=uuid_lib.uuid4,
        editable=False
    )

    class Meta:
        unique_together = ('firstname','lastname','contact_1',)

    def save(self, *args, **kwargs):
        self.firstname = self.firstname.title().strip()
        self.lastname = self.lastname.title().strip()
        super(Cliente, self).save(*args, **kwargs)

class Aro_Orden(models.Model):
    """
    status
        0 = pendiente de entrega
        1 = entregado
        2 = con problemas
    cancelado
        0 = sin cancelar
        1 = abonado
        2 = cancelado
    """
    inventario = models.ForeignKey(Inventario,on_delete=models.PROTECT)
    cliente = models.ForeignKey(Cliente, on_delete=models.PROTECT)
    total = models.PositiveIntegerField()
    status = models.PositiveSmallIntegerField(default=0)
    pagado = models.PositiveSmallIntegerField(default=0)
    observaciones = models.CharField(max_length=255)
    fecha = models.DateField(auto_now_add=True)
    #descuento
    entrega = models.DateField()
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
    tipo = models.PositiveSmallIntegerField(default=0)
    pago = models.PositiveIntegerField()
    orden = models.ForeignKey(Aro_Orden,related_name='abonos_aro',on_delete=models.PROTECT)
    fecha = models.DateField(auto_now_add=True)

