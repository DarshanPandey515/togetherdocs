from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from src.models import CustomUser, Document, DocumentPermission, DocumentVersion


@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    list_display = ('email', 'name', 'is_active', 'is_staff', 'is_superuser', 'date_joined')
    list_filter = ('is_active', 'is_staff', 'is_superuser', 'date_joined')
    search_fields = ('email', 'name')
    ordering = ('email',)
    
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal Info', {'fields': ('name',)}),
        ('Permissions', {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions'),
        }),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'name', 'password1', 'password2'),
        }),
    )
    
    filter_horizontal = ('groups', 'user_permissions')
    
    def get_fieldsets(self, request, obj=None):
        fieldsets = super().get_fieldsets(request, obj)
        for fieldset in fieldsets:
            if 'username' in fieldset[1]['fields']:
                fieldset[1]['fields'] = tuple(f for f in fieldset[1]['fields'] if f != 'username')
        return fieldsets


@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'owner', 'version', 'created_at', 'updated_at')
    list_filter = ('created_at', 'updated_at', 'owner')
    search_fields = ('title', 'content', 'owner__email', 'owner__name')
    readonly_fields = ('id', 'version', 'created_at', 'updated_at')
    ordering = ('-updated_at',)
    
    fieldsets = (
        (None, {
            'fields': ('id', 'owner', 'title', 'content')
        }),
        ('Version Info', {
            'fields': ('version',),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(DocumentPermission)
class DocumentPermissionAdmin(admin.ModelAdmin):
    list_display = ('id', 'document', 'user', 'role', 'created_at')
    list_filter = ('role', 'created_at', 'document')
    search_fields = ('document__title', 'user__email', 'user__name', 'role')
    readonly_fields = ('created_at',)
    ordering = ('-created_at',)
    
    fieldsets = (
        (None, {
            'fields': ('document', 'user', 'role')
        }),
        ('Timestamps', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )


@admin.register(DocumentVersion)
class DocumentVersionAdmin(admin.ModelAdmin):
    list_display = ('id', 'document', 'version', 'created_by', 'created_at')
    list_filter = ('created_at', 'document', 'created_by')
    search_fields = ('document__title', 'content', 'created_by__email', 'created_by__name')
    readonly_fields = ('id', 'version', 'created_at')
    ordering = ('-created_at',)
    
    fieldsets = (
        (None, {
            'fields': ('id', 'document', 'version', 'content')
        }),
        ('Creator Info', {
            'fields': ('created_by',),
        }),
        ('Timestamps', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )