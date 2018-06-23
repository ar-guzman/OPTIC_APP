
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView


class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super(MyTokenObtainPairSerializer, cls).get_token(user)

        token['name'] = '{} {}'.format(user.first_name, user.last_name)
        token['is_admin'] = user.is_superuser
        photo = ''
        optica = None
        try:
            photo = user.empleado.photo.url
        except:
            pass
        try:
            optica = user.empleado.optica.id
        except:
            pass
        token['sucursal'] = optica
        token['photo'] = photo

        return token


class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer
