from inventario.urls import router as inventario_router
from ordenes.urls import router as ordenes_router


inventario_router.registry.extend(ordenes_router.registry)
urlpatterns =  inventario_router.urls


