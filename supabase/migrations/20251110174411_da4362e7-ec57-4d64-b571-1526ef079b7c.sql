-- Crear trigger para crear amistades automáticamente cuando un usuario se registra
-- Este trigger ejecutará la función después de que se inserte un perfil
CREATE TRIGGER on_profile_created_friendship
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.create_friendship_on_user_registration();