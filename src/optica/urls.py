"""optica URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/2.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path
from django.conf.urls import url,include
from django.views.generic import TemplateView
from rest_framework_simplejwt.views import (
    TokenRefreshView,
)
from django.conf import settings
from ordenes.utils import MyTokenObtainPairView
from ordenes.views import some_view

urlpatterns = [
	path('admin/', admin.site.urls),
    url(r'^api/v1/', include('home.urls'), name='api-root'),
    url(r'^api-token-auth/', MyTokenObtainPairView.as_view(),name='api-token-obtain-pair'),
    url(r'^api-token-refresh/', TokenRefreshView.as_view(),name='api-token-refresh'),
    url(r'^$', TemplateView.as_view(template_name='index.html')),
    url(r'^pdf$',some_view),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
