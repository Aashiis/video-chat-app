
from django.urls import path

from accounts.views import CallSessionView, UserLoginView, UserLogoutView, UserProfileView, UserRegisterView


urlpatterns = [
    path('register/', UserRegisterView.as_view(), name='register'),
    path('login/', UserLoginView.as_view(), name='login'),
    path('logout/', UserLogoutView.as_view(), name='logout'),
    path('profile/', UserProfileView.as_view(), name='profile'),
    path('calls/', CallSessionView.as_view(), name='call-sessions'),
]