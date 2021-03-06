# Generated by Django 2.0.3 on 2018-06-22 06:19

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('inventario', '0021_auto_20180529_1804'),
        ('ordenes', '0010_remove_cliente_secondname'),
    ]

    operations = [
        migrations.CreateModel(
            name='Abono_Aro',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('tipo', models.PositiveSmallIntegerField(default=0)),
                ('pago', models.PositiveIntegerField()),
            ],
        ),
        migrations.CreateModel(
            name='Aro_Orden',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('total', models.PositiveIntegerField()),
                ('status', models.PositiveSmallIntegerField(default=0)),
                ('pagado', models.PositiveSmallIntegerField(default=0)),
                ('observaciones', models.CharField(max_length=255)),
                ('inventario', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, to='inventario.Inventario')),
            ],
        ),
        migrations.AddField(
            model_name='abono_aro',
            name='orden',
            field=models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='abonos_aro', to='ordenes.Aro_Orden'),
        ),
    ]
