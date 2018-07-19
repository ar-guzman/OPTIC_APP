from rest_framework.routers import DefaultRouter

from .api.views import ProveedorViewSet, MarcaViewSet, AroViewSet, OpticaViewSet, InventarioViewSet, LaboratorioViewSet, \
    LenteViewSet, FiltroViewSet


router = DefaultRouter()
router.register(r'proveedor', ProveedorViewSet, base_name='proveedor')
router.register(r'marca', MarcaViewSet, base_name='marca')
router.register(r'aro', AroViewSet, base_name='aro')
router.register(r'optica', OpticaViewSet, base_name='optica')
router.register(r'inventario', InventarioViewSet, base_name='inventario')
router.register(r'laboratorio', LaboratorioViewSet, base_name='laboratorio')
router.register(r'lente', LenteViewSet, base_name='lente')
router.register(r'filtro', FiltroViewSet, base_name='filtro')

