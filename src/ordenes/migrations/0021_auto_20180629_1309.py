# Generated by Django 2.0.3 on 2018-06-29 19:09

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('ordenes', '0020_auto_20180625_2213'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='refraction',
            name='ececercaOD',
        ),
        migrations.RemoveField(
            model_name='refraction',
            name='ececercaOS',
        ),
        migrations.RemoveField(
            model_name='refraction',
            name='ecelejosOD',
        ),
        migrations.RemoveField(
            model_name='refraction',
            name='ecelejosOS',
        ),
        migrations.AddField(
            model_name='aro_orden',
            name='offline_id',
            field=models.IntegerField(null=True),
        ),
        migrations.AddField(
            model_name='cliente',
            name='ocupacion',
            field=models.CharField(blank=True, default='', max_length=127),
        ),
        migrations.AddField(
            model_name='completa_orden',
            name='offline_id',
            field=models.IntegerField(null=True),
        ),
        migrations.AddField(
            model_name='refraction',
            name='cilODC',
            field=models.DecimalField(decimal_places=2, default=0, max_digits=4),
        ),
        migrations.AddField(
            model_name='refraction',
            name='cilODF',
            field=models.DecimalField(decimal_places=2, default=0, max_digits=4),
        ),
        migrations.AddField(
            model_name='refraction',
            name='cilOSC',
            field=models.DecimalField(decimal_places=2, default=0, max_digits=4),
        ),
        migrations.AddField(
            model_name='refraction',
            name='ejeODC',
            field=models.SmallIntegerField(default=0),
        ),
        migrations.AddField(
            model_name='refraction',
            name='ejeODF',
            field=models.SmallIntegerField(default=0),
        ),
        migrations.AddField(
            model_name='refraction',
            name='ejeOSC',
            field=models.SmallIntegerField(default=0),
        ),
        migrations.AddField(
            model_name='refraction',
            name='ejeOSF',
            field=models.SmallIntegerField(default=0),
        ),
        migrations.AddField(
            model_name='refraction',
            name='esfODC',
            field=models.DecimalField(decimal_places=2, default=0, max_digits=4),
        ),
        migrations.AddField(
            model_name='refraction',
            name='esfODF',
            field=models.DecimalField(decimal_places=2, default=0, max_digits=4),
        ),
        migrations.AddField(
            model_name='refraction',
            name='esfOSC',
            field=models.DecimalField(decimal_places=2, default=0, max_digits=4),
        ),
        migrations.AddField(
            model_name='refraction',
            name='esfOSF',
            field=models.DecimalField(decimal_places=2, default=0, max_digits=4),
        ),
        migrations.AddField(
            model_name='refraction',
            name='tipoprismaOD',
            field=models.SmallIntegerField(default=0),
        ),
        migrations.AddField(
            model_name='refraction',
            name='tipoprismaOS',
            field=models.SmallIntegerField(default=0),
        ),
        migrations.AlterField(
            model_name='refraction',
            name='addOD',
            field=models.DecimalField(decimal_places=2, default=0, max_digits=4),
        ),
        migrations.AlterField(
            model_name='refraction',
            name='addOI',
            field=models.DecimalField(decimal_places=2, default=0, max_digits=4),
        ),
        migrations.AlterField(
            model_name='refraction',
            name='distL',
            field=models.PositiveSmallIntegerField(default=0),
        ),
        migrations.AlterField(
            model_name='refraction',
            name='prismaOD',
            field=models.SmallIntegerField(default=0),
        ),
        migrations.AlterField(
            model_name='refraction',
            name='prismaOS',
            field=models.SmallIntegerField(default=0),
        ),
        migrations.DeleteModel(
            name='Prisma',
        ),
        migrations.DeleteModel(
            name='RefractionACS',
        ),
    ]
