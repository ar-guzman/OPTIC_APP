# Generated by Django 2.0.3 on 2018-06-26 03:55

from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ('inventario', '0021_auto_20180529_1804'),
        ('ordenes', '0018_auto_20180625_1454'),
    ]

    operations = [
        migrations.CreateModel(
            name='ClientRefraction',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('propia', models.BooleanField(default=True)),
                ('observaciones', models.CharField(blank=True, max_length=255)),
                ('cliente', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='cliente', to='ordenes.Cliente')),
            ],
        ),
        migrations.CreateModel(
            name='Completa_Orden',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('total', models.PositiveIntegerField()),
                ('status', models.PositiveSmallIntegerField(default=0)),
                ('pagado', models.PositiveSmallIntegerField(default=0)),
                ('observaciones', models.CharField(blank=True, max_length=255)),
                ('fecha', models.DateField(auto_now_add=True)),
                ('entrega', models.DateTimeField()),
                ('uuid', models.UUIDField(db_index=True, default=uuid.uuid4, editable=False)),
                ('cliente', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, to='ordenes.Cliente')),
                ('filtros', models.ManyToManyField(related_name='filtros', to='inventario.Filtro')),
                ('inventario', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, to='inventario.Inventario')),
                ('lente', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, to='inventario.Lente')),
            ],
        ),
        migrations.CreateModel(
            name='Prisma',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('prisma', models.SmallIntegerField()),
                ('tipo', models.PositiveSmallIntegerField()),
            ],
        ),
        migrations.CreateModel(
            name='Refraction',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('addOD', models.DecimalField(decimal_places=2, max_digits=4)),
                ('addOI', models.DecimalField(decimal_places=2, max_digits=4)),
                ('distC', models.PositiveSmallIntegerField()),
                ('distL', models.PositiveSmallIntegerField()),
            ],
        ),
        migrations.CreateModel(
            name='RefractionACS',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('eje', models.DecimalField(decimal_places=2, max_digits=4)),
                ('cilindro', models.DecimalField(decimal_places=2, max_digits=4)),
                ('esfera', models.DecimalField(decimal_places=2, max_digits=4)),
            ],
        ),
        migrations.AddField(
            model_name='refraction',
            name='ececercaOD',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.PROTECT, related_name='refractionCOD', to='ordenes.RefractionACS'),
        ),
        migrations.AddField(
            model_name='refraction',
            name='ececercaOS',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.PROTECT, related_name='refractionCOS', to='ordenes.RefractionACS'),
        ),
        migrations.AddField(
            model_name='refraction',
            name='ecelejosOD',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.PROTECT, related_name='refractionFOD', to='ordenes.RefractionACS'),
        ),
        migrations.AddField(
            model_name='refraction',
            name='ecelejosOS',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.PROTECT, related_name='refractionFOS', to='ordenes.RefractionACS'),
        ),
        migrations.AddField(
            model_name='refraction',
            name='prismaOD',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.PROTECT, related_name='prismaOD', to='ordenes.Prisma'),
        ),
        migrations.AddField(
            model_name='refraction',
            name='prismaOS',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.PROTECT, related_name='prismaOS', to='ordenes.Prisma'),
        ),
        migrations.AddField(
            model_name='clientrefraction',
            name='refraction',
            field=models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='refraction', to='ordenes.Refraction'),
        ),
    ]
