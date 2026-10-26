import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FRONTEND_DIR = path.join(REPO_ROOT, 'cinny');

console.log('🚀 Iniciando parche integral, completo e idempotente de traducciones i18n...');

function cleanDuplicates(code) {
  // Deduplica declaraciones consecutivas o repetidas de useTranslation
  let cleaned = code.replace(/(?:[ \t]*const\s*\{\s*t\s*\}\s*=\s*useTranslation\(\);(?:\r?\n)?){2,}/g, '  const { t } = useTranslation();\n');
  return cleaned;
}

function cleanDoubleWrapped(code) {
  // Fix any double wrapped t('...', { defaultValue: '{t('...', { defaultValue: '...' })}' })
  return code.replace(
    /\{t\((['"][^'"]+['"]),\s*\{\s*defaultValue:\s*['"]\{t\(\1,\s*\{\s*defaultValue:\s*('(?:\\.|[^'])*'|"(?:\\.|[^"])*")\s*\}\)\}['"]\s*\}\)\}/g,
    '{t($1, { defaultValue: $2 })}'
  );
}

function ensureImport(code) {
  if (!code.includes("from 'react-i18next'")) {
    return `import { useTranslation } from 'react-i18next';\n` + code;
  }
  return code;
}

function ensureHookInFunc(code, funcStart) {
  const idx = code.indexOf(funcStart);
  if (idx === -1) return code;

  // Find the '(' that opens the parameter list
  const firstParen = code.indexOf('(', idx);
  if (firstParen === -1) return code;

  // Track parentheses to find the closing ')'
  let depth = 1;
  let i = firstParen + 1;
  while (i < code.length && depth > 0) {
    if (code[i] === '(') depth++;
    else if (code[i] === ')') depth--;
    i++;
  }
  if (depth !== 0) return code;

  // Find the opening brace '{' of the function body after the parameter list
  const bodyBrace = code.indexOf('{', i);
  if (bodyBrace === -1) return code;

  const afterBrace = bodyBrace + 1;
  const snippet = code.slice(afterBrace, afterBrace + 250);
  if (snippet.includes('useTranslation()')) return code;

  return code.slice(0, afterBrace) + '\n  const { t } = useTranslation();' + code.slice(afterBrace);
}

// ==========================================
// 1. ACTUALIZAR es-ES/features.json
// ==========================================
const esFeaturesPath = path.join(FRONTEND_DIR, 'public', 'locales', 'es-ES', 'features.json');
let esFeatures = {};
if (fs.existsSync(esFeaturesPath)) {
  try {
    esFeatures = JSON.parse(fs.readFileSync(esFeaturesPath, 'utf8'));
  } catch {
    esFeatures = {};
  }
}

if (!esFeatures.settings) esFeatures.settings = {};

// Raíz de settings
Object.assign(esFeatures.settings, {
  _general: 'General',
  _account: 'Cuenta',
  _notifications: 'Notificaciones',
  _devices: 'Dispositivos',
  emojis_stickers: 'Emojis y stickers',
  developer_tools: 'Herramientas de desarrollo',
  _about: 'Acerca de',
  settings: 'Configuración',
  logout: 'Cerrar sesión',
  keybinds: 'Atajos de teclado',
  keybinds_reset_all: 'Restablecer todo',
  keybinds_also: 'También: ',
  keybinds_press_keys: 'Presiona las teclas...',
  reset: 'Restablecer',
});

// Categorías de atajos
esFeatures.settings.keybinds_categories = {
  messages: 'Mensajes',
  navigation: 'Navegación',
  formatting: 'Formato',
  chat: 'Chat',
  input: 'Entrada',
  call: 'Llamadas',
  media_viewer: 'Visor multimedia',
  emoji_picker: 'Selector de emojis',
};

// Gestos de atajos de teclado
esFeatures.settings.keybinds_gestures = {
  double_click: 'Doble clic',
  hold_shift: 'Mantener Shift',
  any_character: 'Cualquier carácter',
  shift_click: 'Shift+Clic',
  alt_click: 'Alt+Clic',
  click_delete: 'Clic en Eliminar',
};

// Items individuales de atajos de teclado
esFeatures.settings.keybinds_items = {
  // Messages
  'edit-message': 'Editar mensaje',
  'delete-message': 'Eliminar mensaje',
  'pin-message': 'Fijar mensaje',
  'add-reaction': 'Añadir reacción',
  'reply-message': 'Responder',
  'reply-double-click': 'Responder (doble clic en un mensaje)',
  'forward-message': 'Reenviar mensaje',
  'copy-text': 'Copiar texto',
  'mark-unread': 'Marcar como no leído',
  'focus-textarea': 'Enfocar campo de texto',
  'delete-last-message': 'Eliminar último mensaje (sin confirmación ni motivo)',
  'shift-toolbar': 'Mostrar todas las acciones del mensaje al pasar el cursor',
  'delete-message-now': 'Eliminar mensaje de inmediato — omitir motivo (Shift)',

  // Navigation
  'quick-switcher': 'Alternar selector rápido',
  'nav-servers-up': 'Navegar al servidor anterior',
  'nav-servers-down': 'Navegar al siguiente servidor',
  'nav-channels-up': 'Navegar al canal anterior',
  'nav-channels-down': 'Navegar al siguiente canal',
  'nav-history-back': 'Retroceder en el historial de navegación',
  'nav-history-forward': 'Avanzar en el historial de navegación',
  'nav-unread-up': 'Navegar al canal anterior no leído',
  'nav-unread-down': 'Navegar al siguiente canal no leído',
  'nav-unread-mentions-up': 'Navegar a la mención anterior no leída',
  'nav-unread-mentions-down': 'Navegar a la siguiente mención no leída',
  'keyboard-shortcuts': 'Atajos de teclado',

  // Formatting
  'format-bold': 'Negrita',
  'format-italic': 'Cursiva',
  'format-underline': 'Subrayado',
  'format-strikethrough': 'Tachado',
  'format-inline-code': 'Código en línea',
  'format-spoiler': 'Spoiler',
  'format-ordered-list': 'Lista numerada',
  'format-unordered-list': 'Lista con viñetas',
  'format-block-quote': 'Bloque de cita',
  'format-code-block': 'Bloque de código',
  'format-heading-1': 'Encabezado 1',
  'format-heading-2': 'Encabezado 2',
  'format-heading-3': 'Encabezado 3',
  'format-clear': 'Limpiar formato',
  'format-exit-block': 'Salir de bloque (al inicio de encabezado, lista o cita)',

  // Chat
  'mark-server-read': 'Marcar servidor como leído',
  'mark-channel-read': 'Marcar canal como leído',
  'toggle-member-list': 'Alternar lista de miembros',
  'toggle-emoji-picker': 'Alternar selector de emojis',
  'scroll-chat-up': 'Desplazar chat hacia arriba',
  'scroll-chat-down': 'Desplazar chat hacia abajo',
  'jump-oldest-unread': 'Saltar al mensaje no leído más antiguo',
  'upload-file': 'Subir un archivo',

  // Input
  'send-message': 'Enviar mensaje / guardar edición',
  'send-enter': 'Enviar mensaje / guardar edición (salvo con "Enter para nueva línea")',
  'newline': 'Nueva línea',
  'cancel-reply': 'Cerrar autocompletado y cancelar respuesta',
  'cancel-edit': 'Cancelar edición de mensaje',
  'autocomplete-accept': 'Aceptar sugerencia de autocompletado resaltada',
  'focus-textarea-paste': 'Enfocar campo de texto y pegar',
  'focus-textarea-type': 'Enfocar campo de texto (empezar a escribir)',
  'indent': 'Indentar (editor de código)',
  'unindent': 'Desindentar (editor de código)',
  'code-line-below': 'Insertar línea abajo (editor de código)',
  'code-line-above': 'Insertar línea arriba (editor de código)',
  'edit-last-message': 'Editar último mensaje (campo de texto vacío)',

  // Call
  'call-toggle-microphone': 'Alternar micrófono (en llamada)',
  'call-toggle-video': 'Alternar cámara (en llamada)',
  'call-toggle-screenshare': 'Alternar compartir pantalla (en llamada)',
  'call-toggle-sound': 'Alternar audio saliente (en llamada)',
  'call-hangup': 'Salir de la llamada',

  // Media Viewer
  'gallery-close': 'Cerrar visor multimedia',
  'gallery-next': 'Elemento siguiente',
  'gallery-prev': 'Elemento anterior',
  'gallery-mute': 'Alternar silencio',

  // Emoji Picker
  'picker-move': 'Mover resaltado',
  'picker-select': 'Elegir emoji resaltado (o enviar texto como reacción)',
  'picker-select-keep-open': 'Elegir y mantener abierto el selector',
  'picker-click-keep-open': 'Elegir y mantener abierto el selector',
};

// CSS Personalizado
esFeatures.settings.custom_css = {
  title: 'CSS personalizado',
  full_stylesheet: 'Hoja de estilo completa',
  edit_in_editor: 'Editar en editor de texto',
  download_css: 'Descargar archivo CSS',
  watching: 'Supervisando',
  stop_watching: 'Dejar de supervisar',
  export_file: 'Exportar archivo',
  import_file: 'Importar archivo',
  reload_last_edit: 'Recargar última edición',
  no_changes: 'Sin cambios respecto al archivo',
  changes_active: '{{count}} cambios activos',
  snippets: 'Fragmentos (Snippets)',
  snippets_description: 'Pequeño código CSS que se aplica después de todo lo demás, incluidas tus ediciones de hoja de estilo.',
  revert: 'Revertir',
  clear: 'Limpiar',
};

// Audio
esFeatures.settings.audio = {
  microphone: 'Micrófono',
  microphone_access: 'Acceso al micrófono',
  input_device: 'Dispositivo de entrada',
  input_device_description: 'Utilizado para mensajes de voz y llamadas. El predeterminado del sistema sigue lo que conectes.',
  show_devices: 'Mostrar dispositivos',
  system_default: 'Predeterminado del sistema',
  echo_cancellation: 'Cancelación de eco',
  noise_suppression: 'Supresión de ruido',
  noise_suppression_description: 'Desactivalo al grabar algo que no sea voz — trata la música como ruido.',
  auto_gain_control: 'Control automático de ganancia',
};

// Privacidad
esFeatures.settings.privacy = {
  privacy: 'Privacidad',
  hide_window_from_screen_capture: 'Ocultar ventana de la captura de pantalla',
  hide_window_description: 'Pide al sistema omitir esta ventana en capturas y grabaciones de pantalla.',
  block_all_incoming_invites: 'Bloquear todas las invitaciones entrantes',
  block_all_invites_description: 'Tu servidor rechaza las invitaciones a salas antes de que te lleguen. Requiere compatibilidad del servidor (MSC4155).',
  show_media_previews: 'Mostrar vistas previas de multimedia',
  show_media_previews_description: 'Cargar una vista previa la descarga del servidor del remitente, informándole que abriste el mensaje.',
  always: 'Siempre',
  private_rooms_only: 'Solo salas privadas',
  never: 'Nunca',
  show_avatars_in_invites: 'Mostrar avatares en invitaciones',
  show_avatars_description: 'Desactivalo para que una sala invitada por un desconocido no haga que tu cliente descargue su imagen.',
};

// General
if (!esFeatures.settings.general) esFeatures.settings.general = {};
Object.assign(esFeatures.settings.general, {
  general: 'General',
  appearance: 'Apariencia',
  system_theme: 'Tema del sistema',
  choose_between_light: 'Elegí entre tema claro u oscuro según la preferencia del sistema.',
  theme: 'Tema',
  theme_to_use: 'Tema a usar cuando el tema del sistema no esté activado.',
  dark_theme: 'Tema oscuro:',
  light_theme: 'Tema claro:',
  monochrome_mode: 'Modo monocromático',
  twitter_emoji: 'Emojis de Twitter',
  page_zoom: 'Zoom de página',
  formatting: 'Formato',
  year: 'Año',
  two_digit_year: 'Año de dos dígitos',
  four_digit_year: 'Año de cuatro dígitos',
  month: 'Mes',
  the_month: 'El mes',
  two_digit_month: 'Mes de dos dígitos',
  short_month_name: 'Nombre corto del mes',
  full_month_name: 'Nombre completo del mes',
  day_of_the: 'Día del mes',
  day_of_the_month: 'Día del mes',
  two_digit_day_of_the_month: 'Día del mes de dos dígitos',
  day_of_the_week: 'Día de la semana',
  day_of_the_week_sunday: 'Día de la semana (domingo = 0)',
  two_letter_day_name: 'Nombre del día en dos letras',
  short_day_name: 'Nombre corto del día',
  full_day_name: 'Nombre completo del día',
  save: 'Guardar',
  language: 'Idioma',
  choose_your_preferred: 'Elegí tu idioma preferido para la interfaz.',
  messages: 'Mensajes',
  message_layout: 'Diseño de mensajes',
  message_spacing: 'Espaciado de mensajes',
  legacy_username_color: 'Color clásico de nombre de usuario',
  hide_membership_change: 'Ocultar cambios de membresía',
  hide_profile_change: 'Ocultar cambios de perfil',
  disable_media_auto: 'Desactivar carga automática de multimedia',
  url_preview: 'Vista previa de enlaces',
  url_preview_in_encrypted_room: 'Vista previa de enlaces en salas cifradas',
  show_hidden_events: 'Mostrar eventos ocultos',
  date_time: 'Fecha y hora',
  '24_hour_time_format': 'Formato de 24 horas',
  date_format: 'Formato de fecha',
  custom: 'Personalizado',
  editor: 'Editor',
  enter_for_newline: 'ENTER para salto de línea',
  scroll_on_send: 'Desplazar al final al enviar',
  scroll_on_send_description: 'Al enviar un mensaje mientras estás arriba en el historial, vuelve automáticamente al final de la conversación.',
  markdown_formatting: 'Formato Markdown',
  hide_read_receipts: 'No enviar mis confirmaciones de lectura',
  hide_read_receipts_description: 'Envía tus confirmaciones de lectura en privado, sin revelar hasta dónde leíste. Seguirás viendo las de los demás.',
  hide_typing_status: 'No enviar mis notificaciones de escritura',
  hide_typing_status_description: 'Deja de avisar a las salas cuando estás redactando un mensaje. Seguirás viendo las de los demás.',
  hide_others_read_receipts: 'Ocultar confirmaciones de lectura de otros',
  hide_others_read_receipts_description: 'Deja de mostrar quién leyó hasta dónde. Independiente de si envías las tuyas.',
  hide_others_typing_status: 'Ocultar notificaciones de escritura de otros',
  hide_others_typing_status_description: 'Deja de mostrar la línea "X está escribiendo..." debajo de la conversación.',
  read_receipt_style: 'Estilo de confirmación de lectura',
  read_receipt_style_description: 'Predeterminado muestra quién sigue el chat en vivo. Element muestra puntos de avatar en el último mensaje leído de cada persona.',
  default: 'Predeterminado',
  show_maps: 'Mostrar mapas para ubicaciones',
  show_maps_description: 'Muestra los mensajes de ubicación como mapa. Cada mapa descarga teselas del proveedor de mapas correspondiente.',
  render_bot_keyboards: 'Mostrar botones de bots',
  render_bot_keyboards_description: 'Muestra los botones que los bots adjuntan a sus mensajes.',
  confirm_bot_urls: 'Confirmar enlaces de bots',
  confirm_bot_urls_description: 'Preguntar antes de abrir un enlace proveniente del botón de un bot, mostrando el sitio de destino.',
  render_maths: 'Interpretar fórmulas matemáticas en LaTeX',
  render_maths_description: 'Muestra las fórmulas enviadas en formato LaTeX en lugar del texto sin procesar.',
  use_vxtwitter: 'Usar vxtwitter para Twitter/X',
  use_vxtwitter_description: 'Descarga contenido multimedia de Twitter/X mediante la API de vxtwitter para vistas previas completas de video e imagen.',
  use_soundcloak: 'Usar soundcloak para SoundCloud',
  use_soundcloak_description: 'Reescribe enlaces de SoundCloud para incrustaciones reproducibles.',
  use_bluesky_embeds: 'Incrustar publicaciones de Bluesky',
  use_bluesky_embeds_description: 'Descarga publicaciones de Bluesky del lado del cliente para mostrar tarjetas completas.',
  use_rule34_embeds: 'Incrustar publicaciones de Rule34',
  use_rule34_embeds_description: 'Muestra la imagen, GIF o video en línea en lugar de la tarjeta de enlace genérica.',
  use_reddit_embeds: 'Incrustar publicaciones de Reddit',
  use_hackernews_embeds: 'Incrustar publicaciones de Hacker News',
  use_hackernews_embeds_description: 'Construye tarjetas de Hacker News mediante su API oficial.',
  use_piped: 'Usar Piped para YouTube',
  use_piped_description: 'Reemplaza las reproducciones de YouTube con una instancia de Piped para mayor privacidad.',
  piped_instance: 'Instancia de Piped',
  piped_instance_description: 'Instancia de Piped desde la cual incrustar videos.',
  minimize_to_tray: 'Minimizar a la bandeja del sistema',
  minimize_to_tray_description: 'Al cerrar la ventana, se minimiza a la bandeja del sistema en lugar de salir.',
  start_at_login: 'Iniciar al iniciar sesión',
  start_at_login_description: 'Inicia la aplicación minimizada en la bandeja al iniciar sesión en el equipo.',
  client_preview_fallback: 'Vista previa de enlaces en el cliente (alternativa)',
  client_preview_fallback_description: 'Cuando el servidor no pueda generar una vista previa, la app descarga la página directamente para construir la tarjeta.',
  group_membership_changes: 'Agrupar cambios de membresía',
  group_membership_changes_description: 'Colapsa varias uniones, salidas y cambios de perfil consecutivos en una sola línea desplegable.',
  open_media_in_feed: 'Abrir multimedia en la galería',
  open_media_in_feed_description: 'Al pulsar una foto o video se abre la galería de archivos multimedia de la sala.',
  send_attachments_gallery: 'Enviar archivos adjuntos como galería',
  send_attachments_gallery_description: 'Varios archivos enviados a la vez forman un único mensaje en cuadrícula (MSC4274).',
  layout: 'Diseño',
  unified_home_sidebar: 'Barra lateral de inicio unificada',
  unified_home_sidebar_description: 'Muestra los mensajes directos y las salas sin espacio juntos en un solo lugar de Inicio.',
  dm_rail_buttons: 'Botones de mensajes directos en la barra lateral',
  dm_rail_buttons_description: 'Muestra mensajes directos no leídos como botones con avatar debajo de Inicio.',
  top_bar: 'Barra superior',
  top_bar_description: 'Una barra superior de ancho completo encima de la barra lateral con la bandeja de entrada.',
  top_bar_profile: 'Controles de perfil en la barra superior',
  top_bar_profile_description: 'Mueve tu avatar y los controles de estado a la barra superior.',
  default_inbox_tab: 'Pestaña predeterminada de la bandeja',
  default_inbox_tab_description: 'Pestaña en la que se abre la Bandeja de entrada de forma predeterminada.',
  rooms_pseudo_space: 'Espacio de salas',
  rooms_pseudo_space_description: 'Da a las salas sin espacio su propia entrada en la barra de espacios.',
  media: 'Multimedia',
  gif_picker: 'Buscador de GIFs',
  gif_picker_description: 'Agrega una pestaña de GIFs al selector de emojis.',
  emoji_mashup: 'Combinación de emojis (Emoji Mashup)',
  emoji_mashup_description: 'Agrega una pestaña de Emoji Kitchen al panel de emojis con miles de combinaciones de Google.',
  low_animation_mode: 'Modo de animaciones reducidas',
  low_animation_mode_description: 'Pausa la reproducción automática de multimedia y desactiva animaciones de la interfaz.',
  media_auto_embed_hosts: 'Servidores de video incrustado',
  media_auto_embed_hosts_description: 'Servidores separados por comas cuyos videos directos se reproducirán directamente en línea.',
  presence: 'Presencia',
  show_rich_presence: 'Mostrar Rich Presence',
  show_rich_presence_description: 'Muestra lo que otros están escuchando o jugando cuando lo compartan.',
  composer: 'Editor de mensajes',
  emoji_shortcode_replace: 'Reemplazar códigos de emojis',
  emoji_shortcode_replace_description: 'Convierte :codigo: a un emoji a medida que escribes.',
  spaces: 'Espacios',
  auto_join_space_rooms: 'Unirse automáticamente a salas del espacio',
  auto_join_space_rooms_description: 'Unirse a todas las salas que componen un espacio, incluidas las que se agreguen posteriormente.',
});

// Cuenta
if (!esFeatures.settings.account) esFeatures.settings.account = {};
Object.assign(esFeatures.settings.account, {
  account: 'Cuenta',
  matrix_id: 'ID de Matrix',
  copy: 'Copiar',
  profile: 'Perfil',
  avatar: 'Avatar',
  upload: 'Subir',
  remove: 'Eliminar',
  remove_avatar: 'Eliminar avatar',
  are_you_sure: '¿Seguro que querés eliminar el avatar de tu perfil?',
  banner: 'Encabezado / Portada',
  no_banner_set: 'Sin portada configurada',
  change: 'Cambiar',
  display_name: 'Nombre para mostrar',
  save: 'Guardar',
  pronouns: 'Pronombres',
  pronouns_description: 'Separá varios conjuntos de pronombres con comas.',
  timezone: 'Zona horaria',
  detect: 'Detectar',
  status: 'Estado',
  status_description: 'Un mensaje corto que se muestra con tu presencia.',
  biography: 'Biografía',
  biography_description: 'Información pública visible en tu perfil.',
  profile_preview: 'Vista previa del perfil',
  about_me: 'Acerca de mí',
  edit_profile: 'Editar perfil',
  contact_information: 'Información de contacto',
  add_email_address: 'Agregar dirección de correo',
  i_have_clicked_link: 'Ya hice clic en el enlace',
  cancel: 'Cancelar',
  email_addresses: 'Direcciones de correo electrónico',
  email_addresses_description: 'Se utiliza para restablecer tu contraseña y permitir que otros te encuentren si tenés un servidor de identidad configurado.',
  no_email_attached: 'No hay ninguna dirección de correo asociada a esta cuenta.',
  discovery: 'Descubrimiento',
  identity_server: 'Servidor de identidad',
  identity_server_description: 'Opcional. Te permite invitar personas por correo y que te encuentren por el tuyo. El servidor ve cada dirección que buscas, por lo que déjalo en blanco a menos que lo necesites.',
  clear: 'Limpiar',
  saved: 'Guardado.',
  publish_rich_presence: 'Publicar Rich Presence',
  password: 'Contraseña',
  change_password: 'Cambiar contraseña',
  stay_signed_in: 'Mantendrás tu sesión iniciada en este dispositivo.',
  current_password: 'Contraseña actual',
  new_password: 'Nueva contraseña',
  confirm_new_password: 'Confirmar nueva contraseña',
  passwords_must_match: 'Ambas contraseñas deben coincidir antes de continuar.',
  sign_out_all_devices: 'Cerrar sesión en todos los demás dispositivos',
  sign_out_all_description: 'Cualquier persona que use tu cuenta en otro lugar tendrá que iniciar sesión de nuevo.',
  password_changed_success: 'Tu contraseña ha sido cambiada.',
  blocked_users: 'Usuarios bloqueados',
  select_user: 'Seleccionar usuario',
  prevent_receiving: 'Evitá recibir mensajes o invitaciones de un usuario agregando su ID de usuario.',
  users: 'Usuarios',
  unnamed: 'Sin nombre',
  block: 'Bloquear',
  deactivate_account: 'Desactivar cuenta',
  deactivate_description: 'Esta acción no se puede deshacer. Tu cuenta se cerrará, tu ID de Matrix nunca podrá volver a utilizarse y saldrás de todas las salas.',
  also_hide_messages: 'Ocultar también mis mensajes',
  also_hide_messages_description: 'Pide al servidor que elimine todo lo que enviaste. No todos los servidores admiten esta opción.',
  type_to_confirm: 'Escribí {{userId}} para confirmar',
});

// Notificaciones
if (!esFeatures.settings.notifications) esFeatures.settings.notifications = {};
Object.assign(esFeatures.settings.notifications, {
  notifications: 'Notificaciones',
  block_messages: 'Bloquear mensajes',
  this_option_has_been_moved: 'Esta opción se movió a la sección "Cuenta > Usuarios bloqueados".',
  special_messages: 'Mensajes especiales',
  badge: 'Insignia: ',
  mention_user_id: 'Mención de ID de usuario',
  contains_displayname: 'Contiene nombre para mostrar',
  contains_username: 'Contiene nombre de usuario',
  mention_room: 'Mención a @room',
  contains_room: 'Contiene @room',
  system: 'Sistema',
  desktop_notifications: 'Notificaciones de escritorio',
  notification_permission_is_blocked: 'El permiso de notificaciones está bloqueado. Por favor, permití las notificaciones desde la barra de direcciones del navegador.',
  notifications_are_not_supported: 'El sistema no admite notificaciones.',
  show_desktop_notifications: 'Mostrar notificaciones de escritorio cuando llegue un mensaje.',
  enable: 'Activar',
  notification_sound: 'Sonido de notificación',
  play_sound_when_new: 'Reproducir un sonido cuando llegue un mensaje nuevo.',
  hide_message_content: 'Ocultar contenido del mensaje',
  hide_message_content_description: 'Mostrar únicamente el nombre del remitente en las notificaciones del sistema para proteger tu privacidad.',
  email_notification: 'Notificación por correo',
  your_account_does_not_have_any_email: 'Tu cuenta no tiene ningún correo electrónico vinculado.',
  send_notification_to_your_email: 'Enviar notificación a tu correo.',
  unexpected_error: '¡Error inesperado!',
  keyword_messages: 'Mensajes con palabras clave',
  select_keyword: 'Seleccionar palabra clave',
  set_a_notification_preference: 'Configurá una preferencia de notificación para mensajes que contengan una palabra clave determinada.',
  save: 'Guardar',
  all_messages: 'Todos los mensajes',
  '1_to_1_chats': 'Chats individuales',
  '1_to_1_chats_encrypted': 'Chats individuales (cifrados)',
  rooms: 'Salas',
  rooms_encrypted: 'Salas (cifradas)',
  disable: 'Desactivar',
  notify_silent: 'Notificar en silencio',
  notify_loud: 'Notificar con sonido',
  reset: 'Restablecer',
  reset_notifications: 'Restablecer notificaciones',
  restore_default_rules: 'Restaurar reglas predeterminadas de notificación de mensajes y eliminar las de palabras clave.',
});

// Dispositivos
if (!esFeatures.settings.devices) esFeatures.settings.devices = {};
Object.assign(esFeatures.settings.devices, {
  devices: 'Dispositivos',
  security: 'Seguridad',
  device_verification: 'Verificación de dispositivo',
  to_verify_device_identity: 'Para verificar la identidad del dispositivo y otorgar acceso a los mensajes cifrados.',
  current: 'Actual',
  local_backup: 'Copia de seguridad local',
  export_messages_data: 'Exportar datos de mensajes',
  save_password_protected: 'Guardá una copia protegida con contraseña de tus datos de cifrado en tu dispositivo para descifrar mensajes más adelante.',
  expand: 'Desplegar',
  collapse: 'Plegar',
  new_password: 'Nueva contraseña',
  confirm_password: 'Confirmar contraseña',
  export: 'Exportar',
  import_messages_data: 'Importar datos de mensajes',
  load_password_protected: 'Cargá una copia protegida con contraseña de los datos de cifrado desde tu dispositivo para descifrar tus mensajes.',
  import: 'Importar',
  password: 'Contraseña',
  decrypt: 'Descifrar',
  others: 'Otros',
  device_dashboard: 'Panel de dispositivos',
  manage_your_devices: 'Administrá tus dispositivos en el panel de OIDC.',
  open: 'Abrir',
  failed_to_logout: '¡Error al cerrar sesión en los dispositivos! Por favor, intentá de nuevo.',
  logout_from_selected: 'Cerrar sesión en los dispositivos seleccionados.',
  selected: 'seleccionados',
  authentication_steps: 'El cliente no admite los pasos de autenticación necesarios para realizar esta acción.',
  cancel: 'Cancelar',
  logout: 'Cerrar sesión',
  unverified: 'No verificado',
  verified: 'Verificado',
  steps_to_verify: 'Pasos para verificar desde otro dispositivo.',
  open_your_other: 'Abrí tu otro dispositivo verificado.',
  open_settings: 'Abrí Configuración.',
  find_this_device: 'Buscá este dispositivo en la sección Dispositivos/Sesiones.',
  initiate_verification: 'Iniciá la verificación.',
  if_you_do_not: 'Si no tenés ningún dispositivo verificado, presioná el botón Verificar manualmente.',
  start_verification: 'Iniciá la verificación desde otro dispositivo o verificalo manualmente.',
  view_less: 'Ver menos',
  learn_more: 'Más información',
  verify_manually: 'Verificar manualmente',
  verify_device_identity: 'Verificá la identidad del dispositivo y otorgá acceso a los mensajes cifrados.',
  verify: 'Verificar',
  enable: 'Activar',
  reset: 'Restablecer',
  last_activity: 'Última actividad:',
  today: 'Hoy',
  yesterday: 'Ayer',
  device_id: 'ID de dispositivo:',
  ip_address: 'Dirección IP:',
  device_key: 'Clave de dispositivo:',
  loading: 'cargando...',
  device_name: 'Nombre del dispositivo',
  save: 'Guardar',
  device_names_are: 'Los nombres de los dispositivos son visibles públicamente.',
  edit: 'Editar',
  undo: 'Deshacer',
  only_verified_sessions: 'Solo sesiones verificadas',
  only_verified_sessions_description: 'Compartir claves de cifrado únicamente con sesiones verificadas por firma cruzada. Los mensajes de sesiones no verificadas no se descifrarán.',
});

// Emojis y Stickers
const emKey = 'emojis-stickers';
if (!esFeatures.settings[emKey]) esFeatures.settings[emKey] = {};
Object.assign(esFeatures.settings[emKey], {
  emojis_stickers: 'Emojis y stickers',
  room_packs: 'Paquetes de salas',
  save: 'Guardar',
  close: 'Cerrar',
  unselect_all: 'Deseleccionar todo',
  select_all: 'Seleccionar todo',
  unknown: 'Desconocido',
  no_packs: 'Sin paquetes',
  pack_from_rooms: 'Los paquetes de las salas van a aparecer acá. Todavía no estás en ninguna sala con paquetes.',
  favorite_packs: 'Paquetes favoritos',
  favorite_sets: 'Conjuntos favoritos',
  select_pack: 'Seleccionar paquete',
  select_set: 'Seleccionar conjunto',
  pick_emojis_and_stickers: 'Elegí conjuntos de emojis y stickers de las salas para usarlos en cualquier lado.',
  select: 'Seleccionar',
  view: 'Ver',
  failed_to_apply: '¡Error al aplicar los cambios! Por favor, intentá de nuevo.',
  changes_saved: '¡Cambios guardados! Aplicalos cuando quieras.',
  reset: 'Restablecer',
  apply_changes: 'Aplicar cambios',
  default_pack: 'Paquete predeterminado',
  default_set: 'Conjunto predeterminado',
  telegram: 'Telegram',
  sticker_pack_import: 'Importar paquetes de stickers',
  sticker_pack_import_description: 'Pegá un token de bot para importar paquetes desde enlaces de Telegram (t.me/addstickers). Se guarda únicamente en este dispositivo.',
});

// Developer Tools
const dtKey = 'developer-tools';
if (!esFeatures.settings[dtKey]) esFeatures.settings[dtKey] = {};
Object.assign(esFeatures.settings[dtKey], {
  developer_tools: 'Herramientas de desarrollo',
  options: 'Opciones',
  enable_developer_tools: 'Habilitar herramientas de desarrollo',
  access_token: 'Token de acceso',
  copy_access_token: 'Copiar token de acceso al portapapeles.',
  copy: 'Copiar',
  account_data: 'Datos de la cuenta',
  global: 'Global',
  data_stored_in: 'Datos guardados en la información global de tu cuenta.',
  expand: 'Desplegar',
  collapse: 'Plegar',
  events: 'Eventos',
  total: 'Total: ',
  add_new: 'Agregar nuevo',
});

// Acerca de
if (!esFeatures.settings.about) esFeatures.settings.about = {};
Object.assign(esFeatures.settings.about, {
  about: 'Acerca de',
  source_code: 'Código fuente',
  support: 'Soporte',
  clear_cache_reload: 'Borrar caché y recargar',
  clear_all_your_locally_stored: 'Borra todos tus datos guardados localmente y recarga desde el servidor.',
  options: 'Opciones',
  yet_another_matrix: 'Un cliente de Matrix más.',
  tagline: 'Un cliente de Matrix que realmente se siente nativo.',
  clear_cache: 'Borrar caché',
  credits: 'Créditos',
  check_for_updates: 'Buscar actualizaciones',
  checking: 'Comprobando...',
  downloading: 'Descargando...',
  installing: 'Instalando...',
  reload_to_update: 'Recargar para actualizar',
  update_to_version: 'Actualizar a v{{version}}',
  up_to_date: 'Actualizado',
  retry_update_check: 'Reintentar comprobación',
  bestie_is_hard_fork: 'SIMP.Chat es un fork de',
  simp_is_hard_fork: 'SIMP.Chat es un fork de',
  and: 'y',
  packaged_with: ', empaquetado con',
  the_font: 'La fuente',
  the_emoji_art: 'El diseño de emojis de',
  the_sound_resources: 'Los recursos de sonido de',
  is_copyright: 'es ©',
  are_copyright: 'son ©',
  used_under_terms: 'utilizado bajo los términos de',
  used_under_terms_fem: 'utilizada bajo los términos de',
  used_under_terms_pl: 'utilizados bajo los términos de',
});

fs.writeFileSync(esFeaturesPath, JSON.stringify(esFeatures, null, 2), 'utf8');
console.log('✅ es-ES/features.json actualizado por completo.');

// ==========================================
// 2. PARCHEAR COMPONENTES REACT
// ==========================================

function patchFile(filePath, transforms) {
  if (!fs.existsSync(filePath)) {
    console.warn(`Archivo no encontrado: ${filePath}`);
    return;
  }
  let code = fs.readFileSync(filePath, 'utf8');
  code = ensureImport(code);
  for (const transform of transforms) {
    code = transform(code);
  }
  code = cleanDuplicates(code);
  code = cleanDoubleWrapped(code);
  fs.writeFileSync(filePath, code, 'utf8');
  console.log(`✅ ${path.basename(filePath)} parcheado con éxito.`);
}

// A. Account/Account.tsx
patchFile(path.join(FRONTEND_DIR, 'src', 'app', 'features', 'settings', 'account', 'Account.tsx'), [
  (code) => ensureHookInFunc(code, 'export function Account({ requestClose }: AccountProps) {'),
  (code) => code.replace(/<Text size="H3" truncate>\s*Account\s*<\/Text>/, `<Text size="H3" truncate>{t('features:settings._account', { defaultValue: 'Account' })}</Text>`),
]);

// B. Account/MatrixId.tsx
patchFile(path.join(FRONTEND_DIR, 'src', 'app', 'features', 'settings', 'account', 'MatrixId.tsx'), [
  (code) => ensureHookInFunc(code, 'export function MatrixId() {'),
  (code) => code.replace('<Text size="L400">Matrix ID</Text>', `<Text size="L400">{t('features:settings.account.matrix_id', { defaultValue: 'Matrix ID' })}</Text>`),
  (code) => code.replace('<Text size="T200">Copy</Text>', `<Text size="T200">{t('features:settings.account.copy', { defaultValue: 'Copy' })}</Text>`),
]);

// C. Account/Profile.tsx
patchFile(path.join(FRONTEND_DIR, 'src', 'app', 'features', 'settings', 'account', 'Profile.tsx'), [
  (code) => ensureHookInFunc(code, 'function ProfileAvatar({ profile, userId }: ProfileProps) {'),
  (code) => ensureHookInFunc(code, 'function ProfileBanner({ bannerMxc, onBannerChange }: ProfileBannerProps) {'),
  (code) => ensureHookInFunc(code, 'function ProfileDisplayName({ profile, userId }: ProfileProps) {'),
  (code) => ensureHookInFunc(code, 'function ProfilePronouns({ profile }: { profile: UserProfile }) {'),
  (code) => ensureHookInFunc(code, 'function ProfileTimezone({ profile }: { profile: UserProfile }) {'),
  (code) => ensureHookInFunc(code, 'function ProfileStatus({ userId }: { userId: string }) {'),
  (code) => ensureHookInFunc(code, 'function ProfileBiography({ profile }: { profile: UserProfile }) {'),
  (code) => ensureHookInFunc(code, 'export function Profile() {'),
  (code) => code.replace(/<Text as="span" size="L400">\s*Avatar\s*<\/Text>/, `<Text as="span" size="L400">{t('features:settings.account.avatar', { defaultValue: 'Avatar' })}</Text>`),
  (code) => code.replace('<Text size="B300">Upload</Text>', `<Text size="B300">{t('features:settings.account.upload', { defaultValue: 'Upload' })}</Text>`),
  (code) => code.replace('<Text size="B300">Remove</Text>', `<Text size="B300">{t('features:settings.account.remove', { defaultValue: 'Remove' })}</Text>`),
  (code) => code.replace('<Text size="H4">Remove Avatar</Text>', `<Text size="H4">{t('features:settings.account.remove_avatar', { defaultValue: 'Remove Avatar' })}</Text>`),
  (code) => code.replace('<Text priority="400">Are you sure you want to remove profile avatar?</Text>', `<Text priority="400">{t('features:settings.account.are_you_sure', { defaultValue: 'Are you sure you want to remove profile avatar?' })}</Text>`),
  (code) => code.replace('<Text size="B400">Remove</Text>', `<Text size="B400">{t('features:settings.account.remove', { defaultValue: 'Remove' })}</Text>`),
  (code) => code.replace(/<Text as="span" size="L400">\s*Banner\s*<\/Text>/, `<Text as="span" size="L400">{t('features:settings.account.banner', { defaultValue: 'Banner' })}</Text>`),
  (code) => code.replace('<Text size="T200" priority="300">\s*No banner set\s*</Text>', `<Text size="T200" priority="300">{t('features:settings.account.no_banner_set', { defaultValue: 'No banner set' })}</Text>`),
  (code) => code.replace("<Text size=\"B300\">{bannerUrl ? 'Change' : 'Upload'}</Text>", `<Text size=\"B300\">{bannerUrl ? t('features:settings.account.change', { defaultValue: 'Change' }) : t('features:settings.account.upload', { defaultValue: 'Upload' })}</Text>`),
  (code) => code.replace(/<Text as="span" size="L400">\s*Display Name\s*<\/Text>/, `<Text as="span" size="L400">{t('features:settings.account.display_name', { defaultValue: 'Display Name' })}</Text>`),
  (code) => code.replace('<Text size="B400">Save</Text>', `<Text size="B400">{t('features:settings.account.save', { defaultValue: 'Save' })}</Text>`),
  (code) => code.replace(/<Text as="span" size="L400">\s*Pronouns\s*<\/Text>/, `<Text as="span" size="L400">{t('features:settings.account.pronouns', { defaultValue: 'Pronouns' })}</Text>`),
  (code) => code.replace('description="Separate multiple pronoun sets with commas."', `description={t('features:settings.account.pronouns_description', { defaultValue: 'Separate multiple pronoun sets with commas.' })}`),
  (code) => code.replace(/<Text as="span" size="L400">\s*Time Zone\s*<\/Text>/, `<Text as="span" size="L400">{t('features:settings.account.timezone', { defaultValue: 'Time Zone' })}</Text>`),
  (code) => code.replace('<Text size="B400">Detect</Text>', `<Text size="B400">{t('features:settings.account.detect', { defaultValue: 'Detect' })}</Text>`),
  (code) => code.replace(/<Text as="span" size="L400">\s*Status\s*<\/Text>/, `<Text as="span" size="L400">{t('features:settings.account.status', { defaultValue: 'Status' })}</Text>`),
  (code) => code.replace('description="A short message shown with your presence."', `description={t('features:settings.account.status_description', { defaultValue: 'A short message shown with your presence.' })}`),
  (code) => code.replace(/<Text as="span" size="L400">\s*Biography\s*<\/Text>/, `<Text as="span" size="L400">{t('features:settings.account.biography', { defaultValue: 'Biography' })}</Text>`),
  (code) => code.replace('description="Public information shown on your profile."', `description={t('features:settings.account.biography_description', { defaultValue: 'Public information shown on your profile.' })}`),
  (code) => code.replace('<Text size="H3">Profile</Text>', `<Text size="H3">{t('features:settings.account.profile', { defaultValue: 'Profile' })}</Text>`),
  (code) => code.replace('<Text size="L400">Edit Profile</Text>', `<Text size="L400">{t('features:settings.account.edit_profile', { defaultValue: 'Edit Profile' })}</Text>`),
]);

// D. Account/ProfilePreview.tsx
patchFile(path.join(FRONTEND_DIR, 'src', 'app', 'features', 'settings', 'account', 'ProfilePreview.tsx'), [
  (code) => ensureHookInFunc(code, 'export function ProfilePreview({ profile, bannerMxc, userId, requestEdit }: ProfilePreviewProps) {'),
  (code) => code.replace('<Text size="L400">Profile Preview</Text>', `<Text size="L400">{t('features:settings.account.profile_preview', { defaultValue: 'Profile Preview' })}</Text>`),
  (code) => code.replace('<Text size="L400">About Me</Text>', `<Text size="L400">{t('features:settings.account.about_me', { defaultValue: 'About Me' })}</Text>`),
  (code) => code.replace('<Text size="B300">Edit Profile</Text>', `<Text size="B300">{t('features:settings.account.edit_profile', { defaultValue: 'Edit Profile' })}</Text>`),
]);

// E. Account/ContactInfo.tsx
patchFile(path.join(FRONTEND_DIR, 'src', 'app', 'features', 'settings', 'account', 'ContactInfo.tsx'), [
  (code) => ensureHookInFunc(code, 'function AddEmail({ onAdded }: AddEmailProps) {'),
  (code) => ensureHookInFunc(code, 'export function ContactInformation() {'),
  (code) => code.replace('<Text size="L400">Add Email Address</Text>', `<Text size="L400">{t('features:settings.account.add_email_address', { defaultValue: 'Add Email Address' })}</Text>`),
  (code) => code.replace('<Text size="B300">I have clicked the link</Text>', `<Text size="B300">{t('features:settings.account.i_have_clicked_link', { defaultValue: 'I have clicked the link' })}</Text>`),
  (code) => code.replace('<Text size="B300">Cancel</Text>', `<Text size="B300">{t('features:settings.account.cancel', { defaultValue: 'Cancel' })}</Text>`),
  (code) => code.replace('<Text size="L400">Contact Information</Text>', `<Text size="L400">{t('features:settings.account.contact_information', { defaultValue: 'Contact Information' })}</Text>`),
  (code) => code.replace('title="Email Addresses"', `title={t('features:settings.account.email_addresses', { defaultValue: 'Email Addresses' })}`),
  (code) => code.replace('description="Used to reset your password, and to let people find you if you have an identity server set."', `description={t('features:settings.account.email_addresses_description', { defaultValue: 'Used to reset your password, and to let people find you if you have an identity server set.' })}`),
  (code) => code.replace(/<Text size="T200" priority="300">\s*No email address is attached to this account\.\s*<\/Text>/, `<Text size="T200" priority="300">{t('features:settings.account.no_email_attached', { defaultValue: 'No email address is attached to this account.' })}</Text>`),
]);

// F. Account/ChangePassword.tsx
patchFile(path.join(FRONTEND_DIR, 'src', 'app', 'features', 'settings', 'account', 'ChangePassword.tsx'), [
  (code) => ensureHookInFunc(code, 'export function ChangePassword() {'),
  (code) => code.replace('<Text size="L400">Password</Text>', `<Text size="L400">{t('features:settings.account.password', { defaultValue: 'Password' })}</Text>`),
  (code) => code.replace('title="Change Password"', `title={t('features:settings.account.change_password', { defaultValue: 'Change Password' })}`),
  (code) => code.replace('description="You will stay signed in on this device."', `description={t('features:settings.account.stay_signed_in', { defaultValue: 'You will stay signed in on this device.' })}`),
  (code) => code.replace('<Text size="L400">Current Password</Text>', `<Text size="L400">{t('features:settings.account.current_password', { defaultValue: 'Current Password' })}</Text>`),
  (code) => code.replace('<Text size="L400">New Password</Text>', `<Text size="L400">{t('features:settings.account.new_password', { defaultValue: 'New Password' })}</Text>`),
  (code) => code.replace('<Text size="L400">Confirm New Password</Text>', `<Text size="L400">{t('features:settings.account.confirm_new_password', { defaultValue: 'Confirm New Password' })}</Text>`),
  (code) => code.replace(/<Text size="T200" priority="300">\s*Both passwords must match before you can continue\.\s*<\/Text>/, `<Text size="T200" priority="300">{t('features:settings.account.passwords_must_match', { defaultValue: 'Both passwords must match before you can continue.' })}</Text>`),
  (code) => code.replace('title="Sign out of all other devices"', `title={t('features:settings.account.sign_out_all_devices', { defaultValue: 'Sign out of all other devices' })}`),
  (code) => code.replace('description="Anyone using your account elsewhere will have to sign in again. Note that this loses any encryption keys those devices hold that were never backed up."', `description={t('features:settings.account.sign_out_all_description', { defaultValue: 'Anyone using your account elsewhere will have to sign in again. Note that this loses any encryption keys those devices hold that were never backed up.' })}`),
  (code) => code.replace(/<Text size="T200" style=\{\{\s*color:\s*color\.Success\.Main\s*\}\}>\s*Your password has been changed\.\s*<\/Text>/, `<Text size="T200" style={{ color: color.Success.Main }}>{t('features:settings.account.password_changed_success', { defaultValue: 'Your password has been changed.' })}</Text>`),
  (code) => code.replace('<Text size="B400">Change Password</Text>', `<Text size="B400">{t('features:settings.account.change_password', { defaultValue: 'Change Password' })}</Text>`),
]);

// G. Account/IgnoredUserList.tsx
patchFile(path.join(FRONTEND_DIR, 'src', 'app', 'features', 'settings', 'account', 'IgnoredUserList.tsx'), [
  (code) => ensureHookInFunc(code, 'function IgnoreUserInput({ userList }: { userList: string[] }) {'),
  (code) => ensureHookInFunc(code, 'export function IgnoredUserList() {'),
  (code) => code.replace('<Text size="B400">Block</Text>', `<Text size="B400">{t('features:settings.account.block', { defaultValue: 'Block' })}</Text>`),
  (code) => code.replace('<Text size="L400">Blocked Users</Text>', `<Text size="L400">{t('features:settings.account.blocked_users', { defaultValue: 'Blocked Users' })}</Text>`),
  (code) => code.replace('title="Select User"', `title={t('features:settings.account.select_user', { defaultValue: 'Select User' })}`),
  (code) => code.replace('description="Prevent receiving messages or invites from user by adding their userId."', `description={t('features:settings.account.prevent_receiving', { defaultValue: 'Prevent receiving messages or invites from user by adding their userId.' })}`),
  (code) => code.replace('<Text size="L400">Users</Text>', `<Text size="L400">{t('features:settings.account.users', { defaultValue: 'Users' })}</Text>`),
]);

// H. Account/DeactivateAccount.tsx
patchFile(path.join(FRONTEND_DIR, 'src', 'app', 'features', 'settings', 'account', 'DeactivateAccount.tsx'), [
  (code) => ensureHookInFunc(code, 'function DeactivateDialog({ requestClose }: { requestClose: () => void }) {'),
  (code) => ensureHookInFunc(code, 'export function DeactivateAccount() {'),
  (code) => code.replace('<Text size="H4">Deactivate Account</Text>', `<Text size="H4">{t('features:settings.account.deactivate_account', { defaultValue: 'Deactivate Account' })}</Text>`),
  (code) => code.replace(/<Text size="T300" priority="400">\s*This cannot be undone[\s\S]*?stay in those rooms\.\s*<\/Text>/, `<Text size="T300" priority="400">{t('features:settings.account.deactivate_description', { defaultValue: 'This cannot be undone. Your account is closed, your user ID can never be used again, and you are removed from every room you are in. Messages you have already sent stay in those rooms.' })}</Text>`),
  (code) => code.replace('title="Also hide my messages"', `title={t('features:settings.account.also_hide_messages', { defaultValue: 'Also hide my messages' })}`),
  (code) => code.replace('description="Asks the server to redact everything you have sent. Servers are not required to honour this, and copies already held by other servers are beyond its reach."', `description={t('features:settings.account.also_hide_messages_description', { defaultValue: 'Asks the server to redact everything you have sent. Servers are not required to honour this, and copies already held by other servers are beyond its reach.' })}`),
  (code) => code.replace('title="Deactivate Account"', `title={t('features:settings.account.deactivate_account', { defaultValue: 'Deactivate Account' })}`),
  (code) => code.replace('<Text size="B300">Deactivate</Text>', `<Text size="B300">{t('features:settings.account.deactivate_account', { defaultValue: 'Deactivate' })}</Text>`),
]);

// I. Account/IdentityServer.tsx
patchFile(path.join(FRONTEND_DIR, 'src', 'app', 'features', 'settings', 'account', 'IdentityServer.tsx'), [
  (code) => ensureHookInFunc(code, 'export function IdentityServer() {'),
  (code) => code.replace('<Text size="L400">Discovery</Text>', `<Text size="L400">{t('features:settings.account.discovery', { defaultValue: 'Discovery' })}</Text>`),
  (code) => code.replace('title="Identity Server"', `title={t('features:settings.account.identity_server', { defaultValue: 'Identity Server' })}`),
  (code) => code.replace('description="Optional. Lets you invite people by email and be found by yours. The server sees every address you look up, so leave this blank unless you need it."', `description={t('features:settings.account.identity_server_description', { defaultValue: 'Optional. Lets you invite people by email and be found by yours. The server sees every address you look up, so leave this blank unless you need it.' })}`),
  (code) => code.replace("<Text size=\"B400\">{value.trim() === '' ? 'Clear' : 'Save'}</Text>", `<Text size=\"B400\">{value.trim() === '' ? t('features:settings.account.clear', { defaultValue: 'Clear' }) : t('features:settings.account.save', { defaultValue: 'Save' })}</Text>`),
  (code) => code.replace(/<Text size="T200" style=\{\{\s*color:\s*color\.Success\.Main\s*\}\}>\s*Saved\.\s*<\/Text>/, `<Text size="T200" style={{ color: color.Success.Main }}>{t('features:settings.account.saved', { defaultValue: 'Saved.' })}</Text>`),
]);

// J. Account/RichPresencePublish.tsx
patchFile(path.join(FRONTEND_DIR, 'src', 'app', 'features', 'settings', 'account', 'RichPresencePublish.tsx'), [
  (code) => ensureHookInFunc(code, 'export function RichPresencePublish() {'),
  (code) => code.replace('title="Publish rich presence"', `title={t('features:settings.account.publish_rich_presence', { defaultValue: 'Publish rich presence' })}`),
]);

// K. Notifications/AllMessages.tsx
patchFile(path.join(FRONTEND_DIR, 'src', 'app', 'features', 'settings', 'notifications', 'AllMessages.tsx'), [
  (code) => ensureHookInFunc(code, 'export function AllMessagesNotifications() {'),
  (code) => code.replace('<Text size="L400">All Messages</Text>', `<Text size="L400">{t('features:settings.notifications.all_messages', { defaultValue: 'All Messages' })}</Text>`),
  (code) => code.replace('<Text size="T200">Badge: </Text>', `<Text size="T200">{t('features:settings.notifications.badge', { defaultValue: 'Badge: ' })}</Text>`),
  (code) => code.replace('title="1-to-1 Chats"', `title={t('features:settings.notifications.1_to_1_chats', { defaultValue: '1-to-1 Chats' })}`),
  (code) => code.replace('title="1-to-1 Chats (Encrypted)"', `title={t('features:settings.notifications.1_to_1_chats_encrypted', { defaultValue: '1-to-1 Chats (Encrypted)' })}`),
  (code) => code.replace('title="Rooms"', `title={t('features:settings.notifications.rooms', { defaultValue: 'Rooms' })}`),
  (code) => code.replace('title="Rooms (Encrypted)"', `title={t('features:settings.notifications.rooms_encrypted', { defaultValue: 'Rooms (Encrypted)' })}`),
]);

// L. Notifications/SpecialMessages.tsx
patchFile(path.join(FRONTEND_DIR, 'src', 'app', 'features', 'settings', 'notifications', 'SpecialMessages.tsx'), [
  (code) => ensureHookInFunc(code, 'export function SpecialMessagesNotifications() {'),
  (code) => code.replace('<Text size="L400">Special Messages</Text>', `<Text size="L400">{t('features:settings.notifications.special_messages', { defaultValue: 'Special Messages' })}</Text>`),
  (code) => code.replace('<Text size="T200">Badge: </Text>', `<Text size="T200">{t('features:settings.notifications.badge', { defaultValue: 'Badge: ' })}</Text>`),
  (code) => code.replace('title={`Mention User ID ("${userId}")`}', `title={\`\${t('features:settings.notifications.mention_user_id', { defaultValue: 'Mention User ID' })} ("\${userId}")\`}`),
  (code) => code.replace('title={`Contains Displayname ${displayName ? `("${displayName}")` : \'\'}`}', `title={\`\${t('features:settings.notifications.contains_displayname', { defaultValue: 'Contains Displayname' })} \${displayName ? \`("\${displayName}")\` : ''}\`}`),
  (code) => code.replace('title={`Contains Username ("${getMxIdLocalPart(userId)}")`}', `title={\`\${t('features:settings.notifications.contains_username', { defaultValue: 'Contains Username' })} ("\${getMxIdLocalPart(userId)}")\`}`),
  (code) => code.replace('title="Mention @room"', `title={t('features:settings.notifications.mention_room', { defaultValue: 'Mention @room' })}`),
  (code) => code.replace('title="Contains @room"', `title={t('features:settings.notifications.contains_room', { defaultValue: 'Contains @room' })}`),
]);

// M. Notifications/NotificationModeSwitcher.tsx
patchFile(path.join(FRONTEND_DIR, 'src', 'app', 'features', 'settings', 'notifications', 'NotificationModeSwitcher.tsx'), [
  (code) => {
    return code.replace(
      /const useNotificationModeStr = \(\): Record<NotificationMode, string> =>\s*useMemo\(\s*\(\) => \(\{[\s\S]*?\}\),\s*\[\],\s*\);/,
      `const useNotificationModeStr = (): Record<NotificationMode, string> => {\n  const { t } = useTranslation();\n  return useMemo(\n    () => ({\n      [NotificationMode.OFF]: t('features:settings.notifications.disable', { defaultValue: 'Disable' }),\n      [NotificationMode.Notify]: t('features:settings.notifications.notify_silent', { defaultValue: 'Notify Silent' }),\n      [NotificationMode.NotifyLoud]: t('features:settings.notifications.notify_loud', { defaultValue: 'Notify Loud' }),\n    }),\n    [t],\n  );\n};`
    );
  },
]);

// N. Notifications/SystemNotification.tsx
patchFile(path.join(FRONTEND_DIR, 'src', 'app', 'features', 'settings', 'notifications', 'SystemNotification.tsx'), [
  (code) => ensureHookInFunc(code, 'function EmailNotification() {'),
  (code) => ensureHookInFunc(code, 'export function SystemNotification() {'),
  (code) => code.replace('<Text size="L400">System</Text>', `<Text size="L400">{t('features:settings.notifications.system', { defaultValue: 'System' })}</Text>`),
  (code) => code.replace('title="Notifications"', `title={t('features:settings.notifications.desktop_notifications', { defaultValue: 'Notifications' })}`),
  (code) => code.replace('<span>Show notifications when messages arrive.</span>', `<span>{t('features:settings.notifications.show_desktop_notifications', { defaultValue: 'Show notifications when messages arrive.' })}</span>`),
  (code) => code.replace('<Text size="B300">Enable</Text>', `<Text size="B300">{t('features:settings.notifications.enable', { defaultValue: 'Enable' })}</Text>`),
  (code) => code.replace('title="Notification Sound"', `title={t('features:settings.notifications.notification_sound', { defaultValue: 'Notification Sound' })}`),
  (code) => code.replace('description="Play sound when new message arrive."', `description={t('features:settings.notifications.play_sound_when_new', { defaultValue: 'Play sound when new message arrive.' })}`),
  (code) => code.replace('title="Hide message content"', `title={t('features:settings.notifications.hide_message_content', { defaultValue: 'Hide message content' })}`),
  (code) => code.replace('description="Show only the sender\'s name in system notifications. Message text — including decrypted text from encrypted rooms — is otherwise handed to the operating system, which stores it in its notification history where other apps may be able to read it."', `description={t('features:settings.notifications.hide_message_content_description', { defaultValue: "Show only the sender's name in system notifications. Message text — including decrypted text from encrypted rooms — is otherwise handed to the operating system, which stores it in its notification history where other apps may be able to read it." })}`),
  (code) => code.replace('title="Email Notification"', `title={t('features:settings.notifications.email_notification', { defaultValue: 'Email Notification' })}`),
  (code) => code.replace(/<Text as="span" style=\{\{\s*color:\s*color\.Critical\.Main\s*\}\} size="T200">\s*Your account does not have any email attached\.\s*<\/Text>/, `<Text as="span" style={{ color: color.Critical.Main }} size="T200">{t('features:settings.notifications.your_account_does_not_have_any_email', { defaultValue: 'Your account does not have any email attached.' })}</Text>`),
  (code) => code.replace(/<Text as="span" style=\{\{\s*color:\s*color\.Critical\.Main\s*\}\} size="T200">\s*Unexpected Error!\s*<\/Text>/, `<Text as="span" style={{ color: color.Critical.Main }} size="T200">{t('features:settings.notifications.unexpected_error', { defaultValue: 'Unexpected Error!' })}</Text>`),
  (code) => code.replace("result === undefined && 'Send notification to your email.'", `result === undefined && t('features:settings.notifications.send_notification_to_your_email', { defaultValue: 'Send notification to your email.' })`),
]);

// O. Notifications/KeywordMessages.tsx
patchFile(path.join(FRONTEND_DIR, 'src', 'app', 'features', 'settings', 'notifications', 'KeywordMessages.tsx'), [
  (code) => ensureHookInFunc(code, 'function KeywordInput('),
  (code) => ensureHookInFunc(code, 'export function KeywordMessagesNotifications('),
  (code) => code.replace('<Text size="B400">Save</Text>', `<Text size="B400">{t('features:settings.notifications.save', { defaultValue: 'Save' })}</Text>`),
  (code) => code.replace('<Text size="L400">Keyword Messages</Text>', `<Text size="L400">{t('features:settings.notifications.keyword_messages', { defaultValue: 'Keyword Messages' })}</Text>`),
  (code) => code.replace('<Text size="T200">Badge: </Text>', `<Text size="T200">{t('features:settings.notifications.badge', { defaultValue: 'Badge: ' })}</Text>`),
  (code) => code.replace('title="Select Keyword"', `title={t('features:settings.notifications.select_keyword', { defaultValue: 'Select Keyword' })}`),
  (code) => code.replace('description="Set a notification preference for message containing given keyword."', `description={t('features:settings.notifications.set_a_notification_preference', { defaultValue: 'Set a notification preference for message containing given keyword.' })}`),
  (code) => code.replace('description="Set a notification preference for messages containing a given keyword."', `description={t('features:settings.notifications.set_a_notification_preference', { defaultValue: 'Set a notification preference for message containing given keyword.' })}`),
]);

// P. Notifications/ResetNotification.tsx
patchFile(path.join(FRONTEND_DIR, 'src', 'app', 'features', 'settings', 'notifications', 'ResetNotification.tsx'), [
  (code) => ensureHookInFunc(code, 'function ResetPrompt('),
  (code) => ensureHookInFunc(code, 'export function ResetNotification('),
  (code) => code.replace('<Text size="H4">Reset Notifications</Text>', `<Text size="H4">{t('features:settings.notifications.reset_notifications', { defaultValue: 'Reset Notifications' })}</Text>`),
  (code) => code.replace('<Text size="L400">Reset</Text>', `<Text size="L400">{t('features:settings.notifications.reset', { defaultValue: 'Reset' })}</Text>`),
  (code) => code.replace('title="Reset Notifications"', `title={t('features:settings.notifications.reset_notifications', { defaultValue: 'Reset Notifications' })}`),
  (code) => code.replace('description="Restore default message notification rules and remove keyword notifications."', `description={t('features:settings.notifications.restore_default_rules', { defaultValue: 'Restore default message notification rules and remove keyword notifications.' })}`),
  (code) => code.replace('<Text size="B300">Reset</Text>', `<Text size="B300">{t('features:settings.notifications.reset', { defaultValue: 'Reset' })}</Text>`),
]);

// Q. Devices/Devices.tsx
patchFile(path.join(FRONTEND_DIR, 'src', 'app', 'features', 'settings', 'devices', 'Devices.tsx'), [
  (code) => ensureHookInFunc(code, 'export function Devices('),
  (code) => code.replace('<Text size="L400">Security</Text>', `<Text size="L400">{t('features:settings.devices.security', { defaultValue: 'Security' })}</Text>`),
  (code) => code.replace('title="Device Verification"', `title={t('features:settings.devices.device_verification', { defaultValue: 'Device Verification' })}`),
  (code) => code.replace('description="To verify device identity and grant access to encrypted messages."', `description={t('features:settings.devices.to_verify_device_identity', { defaultValue: 'To verify device identity and grant access to encrypted messages.' })}`),
  (code) => code.replace('<Text size="L400">Current</Text>', `<Text size="L400">{t('features:settings.devices.current', { defaultValue: 'Current' })}</Text>`),
  (code) => code.replace('<Text size="L400">Others</Text>', `<Text size="L400">{t('features:settings.devices.others', { defaultValue: 'Others' })}</Text>`),
]);

// R. Devices/DeviceTile.tsx
patchFile(path.join(FRONTEND_DIR, 'src', 'app', 'features', 'settings', 'devices', 'DeviceTile.tsx'), [
  (code) => ensureHookInFunc(code, 'function DeviceRename('),
  (code) => ensureHookInFunc(code, 'function DeviceActiveTime('),
  (code) => ensureHookInFunc(code, 'function DeviceDetails('),
  (code) => ensureHookInFunc(code, 'export function DeviceKeyDetails('),
  (code) => ensureHookInFunc(code, 'export function DeviceTile('),
  (code) => {
    if (code.includes('features:settings.devices.last_activity')) return code;
    return code.replace("{'Last activity: '}", "{t('features:settings.devices.last_activity', { defaultValue: 'Last activity: ' })}");
  },
  (code) => code.replace("{today(ts) && 'Today'}", "{today(ts) && t('features:settings.devices.today', { defaultValue: 'Today' })}"),
  (code) => code.replace("{yesterday(ts) && 'Yesterday'}", "{yesterday(ts) && t('features:settings.devices.yesterday', { defaultValue: 'Yesterday' })}"),
  (code) => code.replace('Device ID: <i>', "{t('features:settings.devices.device_id', { defaultValue: 'Device ID: ' })}<i>"),
  (code) => code.replace('IP Address: <i>', "{t('features:settings.devices.ip_address', { defaultValue: 'IP Address: ' })}<i>"),
  (code) => code.replace('Device Key:{\' \'\}', "{t('features:settings.devices.device_key', { defaultValue: 'Device Key: ' })}"),
  (code) => code.replace('<Text size="B300">Save</Text>', `<Text size="B300">{t('features:settings.devices.save', { defaultValue: 'Save' })}</Text>`),
  (code) => code.replace('description="Device names are visible publicly."', `description={t('features:settings.devices.device_names_are', { defaultValue: 'Device names are visible publicly.' })}`),
]);

// S. Devices/LocalBackup.tsx
patchFile(path.join(FRONTEND_DIR, 'src', 'app', 'features', 'settings', 'devices', 'LocalBackup.tsx'), [
  (code) => ensureHookInFunc(code, 'function ExportKeysTile('),
  (code) => ensureHookInFunc(code, 'function ExportKeys('),
  (code) => ensureHookInFunc(code, 'function ImportKeysTile('),
  (code) => ensureHookInFunc(code, 'function ImportKeys('),
  (code) => ensureHookInFunc(code, 'export function LocalBackup('),
  (code) => code.replace('<Text size="L400">New Password</Text>', `<Text size="L400">{t('features:settings.devices.new_password', { defaultValue: 'New Password' })}</Text>`),
  (code) => code.replace('<Text size="L400">Confirm Password</Text>', `<Text size="L400">{t('features:settings.devices.confirm_password', { defaultValue: 'Confirm Password' })}</Text>`),
  (code) => code.replace('<Text size="B400">Export</Text>', `<Text size="B400">{t('features:settings.devices.export', { defaultValue: 'Export' })}</Text>`),
  (code) => code.replace('<Text size="L400">Password</Text>', `<Text size="L400">{t('features:settings.devices.password', { defaultValue: 'Password' })}</Text>`),
  (code) => code.replace('<Text size="B400">Decrypt</Text>', `<Text size="B400">{t('features:settings.devices.decrypt', { defaultValue: 'Decrypt' })}</Text>`),
  (code) => code.replace('<Text size="L400">Local Backup</Text>', `<Text size="L400">{t('features:settings.devices.local_backup', { defaultValue: 'Local Backup' })}</Text>`),
  (code) => code.replace('title="Export Messages Data"', `title={t('features:settings.devices.export_messages_data', { defaultValue: 'Export Messages Data' })}`),
  (code) => code.replace('description="Save password protected copy of encryption data on your device to decrypt messages later."', `description={t('features:settings.devices.save_password_protected', { defaultValue: 'Save password-protected copy of your encryption data on your device to decrypt messages later.' })}`),
  (code) => code.replace('description="Save password-protected copy of your encryption data on your device to decrypt messages later."', `description={t('features:settings.devices.save_password_protected', { defaultValue: 'Save password-protected copy of your encryption data on your device to decrypt messages later.' })}`),
  (code) => code.replace("{expand ? 'Collapse' : 'Expand'}", `{expand ? t('features:settings.devices.collapse', { defaultValue: 'Collapse' }) : t('features:settings.devices.expand', { defaultValue: 'Expand' })}`),
  (code) => code.replace("{expandExport ? 'Collapse' : 'Expand'}", `{expandExport ? t('features:settings.devices.collapse', { defaultValue: 'Collapse' }) : t('features:settings.devices.expand', { defaultValue: 'Expand' })}`),
  (code) => code.replace('title="Import Messages Data"', `title={t('features:settings.devices.import_messages_data', { defaultValue: 'Import Messages Data' })}`),
  (code) => code.replace('description="Load password protected copy of encryption data from device to decrypt your messages."', `description={t('features:settings.devices.load_password_protected', { defaultValue: 'Load password-protected copy of encryption data from your device to decrypt your messages.' })}`),
  (code) => code.replace('description="Load password-protected copy of encryption data from your device to decrypt your messages."', `description={t('features:settings.devices.load_password_protected', { defaultValue: 'Load password-protected copy of encryption data from your device to decrypt your messages.' })}`),
  (code) => code.replace("{expandImport ? 'Collapse' : 'Expand'}", `{expandImport ? t('features:settings.devices.collapse', { defaultValue: 'Collapse' }) : t('features:settings.devices.expand', { defaultValue: 'Expand' })}`),
]);

// T. Devices/OtherDevices.tsx
patchFile(path.join(FRONTEND_DIR, 'src', 'app', 'features', 'settings', 'devices', 'OtherDevices.tsx'), [
  (code) => ensureHookInFunc(code, 'export function OtherDevices({ devices, refreshDeviceList, showVerification }: OtherDevicesProps) {'),
  (code) => code.replace('title="Device Dashboard"', `title={t('features:settings.devices.device_dashboard', { defaultValue: 'Device Dashboard' })}`),
  (code) => code.replace('description="Manage your devices in OIDC dashboard."', `description={t('features:settings.devices.manage_your_devices', { defaultValue: 'Manage your devices in OIDC dashboard.' })}`),
  (code) => code.replace('<Text size="B300">Open</Text>', `<Text size="B300">{t('features:settings.devices.open', { defaultValue: 'Open' })}</Text>`),
  (code) => code.replace('title={`Logout from selected devices. (${deleted.size} selected)`}', `title={\`\${t('features:settings.devices.logout_from_selected', { defaultValue: 'Logout from selected devices.' })} (\${deleted.size} \${t('features:settings.devices.selected', { defaultValue: 'selected' })})\`}`),
  (code) => code.replace('<Text size="B300">Cancel</Text>', `<Text size="B300">{t('features:settings.devices.cancel', { defaultValue: 'Cancel' })}</Text>`),
  (code) => code.replace('<Text size="B300">Logout</Text>', `<Text size="B300">{t('features:settings.devices.logout', { defaultValue: 'Logout' })}</Text>`),
]);

// U. Devices/Verification.tsx
patchFile(path.join(FRONTEND_DIR, 'src', 'app', 'features', 'settings', 'devices', 'Verification.tsx'), [
  (code) => ensureHookInFunc(code, 'export function VerificationStatusBadge({'),
  (code) => ensureHookInFunc(code, 'function LearnStartVerificationFromOtherDevice() {'),
  (code) => ensureHookInFunc(code, 'export function VerifyCurrentDeviceTile({'),
  (code) => ensureHookInFunc(code, 'export function EnableVerification({'),
  (code) => code.replace('<Text size="L400">Unverified</Text>', `<Text size="L400">{t('features:settings.devices.unverified', { defaultValue: 'Unverified' })}</Text>`),
  (code) => code.replace('<Text size="L400">Verified</Text>', `<Text size="L400">{t('features:settings.devices.verified', { defaultValue: 'Verified' })}</Text>`),
  (code) => code.replace('<Text size="T200">Steps to verify from other device.</Text>', `<Text size="T200">{t('features:settings.devices.steps_to_verify', { defaultValue: 'Steps to verify from other device.' })}</Text>`),
  (code) => code.replace('<li>Open your other verified device.</li>', `<li>{t('features:settings.devices.open_your_other', { defaultValue: 'Open your other verified device.' })}</li>`),
  (code) => code.replace('<li>Initiate verification.</li>', `<li>{t('features:settings.devices.initiate_verification', { defaultValue: 'Initiate verification.' })}</li>`),
  (code) => code.replace('<Text size="B300">Verify Manually</Text>', `<Text size="B300">{t('features:settings.devices.verify_manually', { defaultValue: 'Verify Manually' })}</Text>`),
  (code) => code.replace("<Text size=\"B300\">{learn ? 'View Less' : 'Learn More'}</Text>", `<Text size=\"B300\">{learn ? t('features:settings.devices.view_less', { defaultValue: 'View Less' }) : t('features:settings.devices.learn_more', { defaultValue: 'Learn More' })}</Text>`),
  (code) => code.replace('title="Verify Device Identity"', `title={t('features:settings.devices.verify_device_identity', { defaultValue: 'Verify Device Identity' })}`),
  (code) => code.replace('description="To verify device identity and grant access to encrypted messages."', `description={t('features:settings.devices.to_verify_device_identity', { defaultValue: 'To verify device identity and grant access to encrypted messages.' })}`),
  (code) => code.replace('<Text size="B300">Verify</Text>', `<Text size="B300">{t('features:settings.devices.verify', { defaultValue: 'Verify' })}</Text>`),
  (code) => code.replace('<Text size="B300">Enable</Text>', `<Text size="B300">{t('features:settings.devices.enable', { defaultValue: 'Enable' })}</Text>`),
  (code) => code.replace('<Text size="B300">Reset</Text>', `<Text size="B300">{t('features:settings.devices.reset', { defaultValue: 'Reset' })}</Text>`),
]);

// V. Devices/OnlyVerifiedDevices.tsx
patchFile(path.join(FRONTEND_DIR, 'src', 'app', 'features', 'settings', 'devices', 'OnlyVerifiedDevices.tsx'), [
  (code) => ensureHookInFunc(code, 'export function OnlyVerifiedDevicesTile() {'),
  (code) => code.replace('title="Only Verified Sessions"', `title={t('features:settings.devices.only_verified_sessions', { defaultValue: 'Only Verified Sessions' })}`),
  (code) => code.replace('description="Only share message encryption keys with cross-signed sessions. Messages from unverified sessions won\'t decrypt. Sending will fail if any participant has an unverified session."', `description={t('features:settings.devices.only_verified_sessions_description', { defaultValue: "Only share message encryption keys with cross-signed sessions. Messages from unverified sessions won't decrypt. Sending will fail if any participant has an unverified session." })}`),
]);

// W. Emojis-Stickers/EmojisStickers.tsx
patchFile(path.join(FRONTEND_DIR, 'src', 'app', 'features', 'settings', 'emojis-stickers', 'EmojisStickers.tsx'), [
  (code) => ensureHookInFunc(code, 'export function EmojisStickers({ requestClose }: EmojisStickersProps) {'),
  (code) => code.replace(/<Text size="H3" truncate>\s*Emojis & Stickers\s*<\/Text>/, `<Text size="H3" truncate>{t('features:settings.emojis_stickers', { defaultValue: 'Emojis & Stickers' })}</Text>`),
]);

// X. Emojis-Stickers/UserPack.tsx
patchFile(path.join(FRONTEND_DIR, 'src', 'app', 'features', 'settings', 'emojis-stickers', 'UserPack.tsx'), [
  (code) => ensureHookInFunc(code, 'export function UserPack({ onViewPack }: UserPackProps) {'),
  (code) => code.replace('<Text size="L400">Default Set</Text>', `<Text size="L400">{t('features:settings.emojis-stickers.default_set', { defaultValue: 'Default Set' })}</Text>`),
  (code) => code.replace("<Text size=\"B300\">View</Text>", `<Text size=\"B300\">{t('features:settings.emojis-stickers.view', { defaultValue: 'View' })}</Text>`),
]);

// Y. Emojis-Stickers/GlobalPacks.tsx
patchFile(path.join(FRONTEND_DIR, 'src', 'app', 'features', 'settings', 'emojis-stickers', 'GlobalPacks.tsx'), [
  (code) => ensureHookInFunc(code, 'export function GlobalPacks({ onViewPack }: GlobalPacksProps) {'),
  (code) => code.replace('<Text size="L400">Favorite Sets</Text>', `<Text size="L400">{t('features:settings.emojis-stickers.favorite_sets', { defaultValue: 'Favorite Sets' })}</Text>`),
  (code) => code.replace('title="Select Set"', `title={t('features:settings.emojis-stickers.select_set', { defaultValue: 'Select Set' })}`),
  (code) => code.replace('description="Pick emojis and stickers set from rooms to use in all rooms."', `description={t('features:settings.emojis-stickers.pick_emojis_and_stickers', { defaultValue: 'Pick emojis and stickers set from rooms to use in all rooms.' })}`),
  (code) => code.replace('<Text size="B300">Select</Text>', `<Text size="B300">{t('features:settings.emojis-stickers.select', { defaultValue: 'Select' })}</Text>`),
  (code) => code.replace('<Text size="B300">View</Text>', `<Text size="B300">{t('features:settings.emojis-stickers.view', { defaultValue: 'View' })}</Text>`),
]);

// Z. Emojis-Stickers/TelegramImportSetting.tsx
patchFile(path.join(FRONTEND_DIR, 'src', 'app', 'features', 'settings', 'emojis-stickers', 'TelegramImportSetting.tsx'), [
  (code) => ensureHookInFunc(code, 'export function TelegramImportSetting() {'),
  (code) => code.replace('<Text size="L400">Telegram</Text>', `<Text size="L400">{t('features:settings.emojis-stickers.telegram', { defaultValue: 'Telegram' })}</Text>`),
  (code) => code.replace('title="Sticker pack import"', `title={t('features:settings.emojis-stickers.sticker_pack_import', { defaultValue: 'Sticker pack import' })}`),
  (code) => code.replace('description="Paste a bot token to import packs from t.me/addstickers links, using the Import button inside any pack you can edit. Create a bot with @BotFather on Telegram — Telegram publishes sticker sets nowhere else, so there is no way to import without one. Stored on this device only, never sent to your homeserver, and used solely for requests to api.telegram.org."', `description={t('features:settings.emojis-stickers.sticker_pack_import_description', { defaultValue: 'Paste a bot token to import packs from t.me/addstickers links, using the Import button inside any pack you can edit. Create a bot with @BotFather on Telegram — Telegram publishes sticker sets nowhere else, so there is no way to import without one. Stored on this device only, never sent to your homeserver, and used solely for requests to api.telegram.org.' })}`),
  (code) => code.replace('<Text size="B400">Save</Text>', `<Text size="B400">{t('features:settings.emojis-stickers.save', { defaultValue: 'Save' })}</Text>`),
]);

// AA. DeveloperTools/DevelopTools.tsx
patchFile(path.join(FRONTEND_DIR, 'src', 'app', 'features', 'settings', 'developer-tools', 'DevelopTools.tsx'), [
  (code) => ensureHookInFunc(code, 'export function DeveloperTools({ requestClose }: DeveloperToolsProps) {'),
  (code) => code.replace(/<Text size="H3" truncate>\s*Developer Tools\s*<\/Text>/, `<Text size="H3" truncate>{t('features:settings.developer_tools', { defaultValue: 'Developer Tools' })}</Text>`),
  (code) => code.replace('<Text size="L400">Options</Text>', `<Text size="L400">{t('features:settings.developer-tools.options', { defaultValue: 'Options' })}</Text>`),
  (code) => code.replace('title="Enable Developer Tools"', `title={t('features:settings.developer-tools.enable_developer_tools', { defaultValue: 'Enable Developer Tools' })}`),
  (code) => code.replace('title="Access Token"', `title={t('features:settings.developer-tools.access_token', { defaultValue: 'Access Token' })}`),
  (code) => code.replace('description="Copy access token to clipboard."', `description={t('features:settings.developer-tools.copy_access_token', { defaultValue: 'Copy access token to clipboard.' })}`),
  (code) => code.replace('<Text size="T200">Copy</Text>', `<Text size="T200">{t('features:settings.developer-tools.copy', { defaultValue: 'Copy' })}</Text>`),
]);

// AB. DeveloperTools/AccountData.tsx
patchFile(path.join(FRONTEND_DIR, 'src', 'app', 'features', 'settings', 'developer-tools', 'AccountData.tsx'), [
  (code) => ensureHookInFunc(code, 'export function AccountData({ expand, onExpandToggle, onSelect }: AccountDataProps) {'),
  (code) => code.replace('<Text size="L400">Account Data</Text>', `<Text size="L400">{t('features:settings.developer-tools.account_data', { defaultValue: 'Account Data' })}</Text>`),
  (code) => code.replace('title="Global"', `title={t('features:settings.developer-tools.global', { defaultValue: 'Global' })}`),
  (code) => code.replace('description="Data stored in your global account data."', `description={t('features:settings.developer-tools.data_stored_in', { defaultValue: 'Data stored in your global account data.' })}`),
  (code) => code.replace("<Text size=\"B300\">{expand ? 'Collapse' : 'Expand'}</Text>", `<Text size=\"B300\">{expand ? t('features:settings.developer-tools.collapse', { defaultValue: 'Collapse' }) : t('features:settings.developer-tools.expand', { defaultValue: 'Expand' })}</Text>`),
  (code) => code.replace('<Text size="L400">Events</Text>', `<Text size="L400">{t('features:settings.developer-tools.events', { defaultValue: 'Events' })}</Text>`),
  (code) => code.replace('<Text size="L400">Total: {accountDataTypes.length}</Text>', `<Text size="L400">{t('features:settings.developer-tools.total', { defaultValue: 'Total: ' })}{accountDataTypes.length}</Text>`),
  (code) => code.replace('<Text size="T200" truncate>\s*Add New\s*</Text>', `<Text size="T200" truncate>{t('features:settings.developer-tools.add_new', { defaultValue: 'Add New' })}</Text>`),
]);

// AC. About/About.tsx
patchFile(path.join(FRONTEND_DIR, 'src', 'app', 'features', 'settings', 'about', 'About.tsx'), [
  (code) => ensureHookInFunc(code, 'export function About({ requestClose }: AboutProps) {'),
  (code) => code.replace(/import (?:BestieSVG|PrinnySVG) from ['"][^'"]+['"];/, "import SimpSVG from '../../../../../public/res/svg/simp.svg';"),
  (code) => code.replace(/src=\{(?:BestieSVG|PrinnySVG)\}/g, 'src={SimpSVG}'),
  (code) => code.replace(/alt="(?:Bestie|Prinny) Client logo"/g, 'alt="SIMP.Chat logo"'),
  (code) => code.replace(/<Text size="H3">(?:Bestie Client|Prinny Client)<\/Text>/g, '<Text size="H3">SIMP.Chat</Text>'),
  (code) => code.replace(/href="https:\/\/github\.com\/(?:cristianapas|cinnyapp|coffeegrind123)\/(?:Bestie|prinny-client)"/g, 'href="https://github.com/cristianapas/SIMP.Chat"'),
  (code) => code.replace(/<Text size="H3" truncate>\s*About\s*<\/Text>/, `<Text size="H3" truncate>{t('features:settings._about', { defaultValue: 'About' })}</Text>`),
  (code) => code.replace('<Text>A Matrix chat client that actually feels native.</Text>', `<Text>{t('features:settings.about.tagline', { defaultValue: 'A Matrix chat client that actually feels native.' })}</Text>`),
  (code) => code.replace('<Text size="B300">Source Code</Text>', `<Text size="B300">{t('features:settings.about.source_code', { defaultValue: 'Source Code' })}</Text>`),
  (code) => code.replace('<Text size="L400">Options</Text>', `<Text size="L400">{t('features:settings.about.options', { defaultValue: 'Options' })}</Text>`),
  (code) => code.replace('title="Clear Cache & Reload"', `title={t('features:settings.about.clear_cache_reload', { defaultValue: 'Clear Cache & Reload' })}`),
  (code) => code.replace('description="Clear all your locally stored data and reload from server."', `description={t('features:settings.about.clear_all_your_locally_stored', { defaultValue: 'Clear all your locally stored data and reload from server.' })}`),
  (code) => code.replace('<Text size="B300">Clear Cache</Text>', `<Text size="B300">{t('features:settings.about.clear_cache', { defaultValue: 'Clear Cache' })}</Text>`),
  (code) => code.replace('<Text size="L400">Credits</Text>', `<Text size="L400">{t('features:settings.about.credits', { defaultValue: 'Credits' })}</Text>`),
  (code) => code.replace(
    /const updateButton = \([\s\S]*?\): \{ label: string; busy: boolean; install: boolean \} => \{[\s\S]*?default:[\s\S]*?return \{ label: 'Check for Updates', busy: false, install: false \};[\s\S]*?\};/,
    `const updateButton = (
  status: ReturnType<typeof useUpdateCheck>['status'],
  update: ReturnType<typeof useUpdateCheck>['update'],
  t: (key: string, opts?: any) => string,
): { label: string; busy: boolean; install: boolean } => {
  switch (status) {
    case 'checking':
      return { label: t('features:settings.about.checking', { defaultValue: 'Comprobando...' }), busy: true, install: false };
    case 'downloading':
      return { label: t('features:settings.about.downloading', { defaultValue: 'Descargando...' }), busy: true, install: false };
    case 'installing':
      return { label: t('features:settings.about.installing', { defaultValue: 'Instalando...' }), busy: true, install: false };
    case 'available':
      return {
        label: update?.version
          ? t('features:settings.about.update_to_version', { version: update.version, defaultValue: \`Actualizar a v\${update.version}\` })
          : t('features:settings.about.reload_to_update', { defaultValue: 'Recargar para actualizar' }),
        busy: false,
        install: true,
      };
    case 'no-update':
      return { label: t('features:settings.about.up_to_date', { defaultValue: 'Actualizado' }), busy: false, install: false };
    case 'error':
      return { label: t('features:settings.about.retry_update_check', { defaultValue: 'Reintentar comprobación' }), busy: false, install: false };
    default:
      return { label: t('features:settings.about.check_for_updates', { defaultValue: 'Buscar actualizaciones' }), busy: false, install: false };
  }
};`
  ),
  (code) => code.replace('const updateAction = updateButton(status, update);', 'const updateAction = updateButton(status, update, t);'),
  (code) => {
    const oldCreditsBlock = /<Box\s+as="ul"[\s\S]*?<li>[\s\S]*?(?:Prinny|Bestie|SIMP\.Chat|Cinny) Client (?:is a hard fork of|es un fork de)[\s\S]*?<\/Box>/;
    const newCreditsBlock = `<Box
                      as="ul"
                      direction="Column"
                      gap="200"
                      style={{
                        margin: 0,
                        paddingLeft: config.space.S400,
                      }}
                    >
                      <li>
                        <Text size="T300">
                          {t('features:settings.about.simp_is_hard_fork', { defaultValue: 'SIMP.Chat es un fork de' })}{' '}
                          <a
                            href="https://github.com/cinnyapp/cinny"
                            rel="noreferrer noopener"
                            target="_blank"
                          >
                            Cinny
                          </a>{' '}
                          {t('features:settings.about.and', { defaultValue: 'y' })}{' '}
                          <a
                            href="https://github.com/cinnyapp/cinny-desktop"
                            rel="noreferrer noopener"
                            target="_blank"
                          >
                            cinny-desktop
                          </a>
                          {t('features:settings.about.packaged_with', { defaultValue: ', empaquetado con' })}{' '}
                          <a href="https://v2.tauri.app" rel="noreferrer noopener" target="_blank">
                            Tauri v2
                          </a>
                          .
                        </Text>
                      </li>
                      <li>
                        <Text size="T300">
                          <a
                            href="https://github.com/matrix-org/matrix-js-sdk"
                            rel="noreferrer noopener"
                            target="_blank"
                          >
                            matrix-js-sdk
                          </a>{' '}
                          {t('features:settings.about.is_copyright', { defaultValue: 'es ©' })}{' '}
                          <a
                            href="https://matrix.org/foundation"
                            rel="noreferrer noopener"
                            target="_blank"
                          >
                            The Matrix.org Foundation C.I.C
                          </a>
                          {', '}
                          {t('features:settings.about.used_under_terms', { defaultValue: 'utilizado bajo los términos de' })}{' '}
                          <a
                            href="http://www.apache.org/licenses/LICENSE-2.0"
                            rel="noreferrer noopener"
                            target="_blank"
                          >
                            Apache 2.0
                          </a>
                          .
                        </Text>
                      </li>
                      <li>
                        <Text size="T300">
                          {t('features:settings.about.the_font', { defaultValue: 'La fuente' })}{' '}
                          <a
                            href="https://github.com/mozilla/twemoji-colr"
                            target="_blank"
                            rel="noreferrer noopener"
                          >
                            twemoji-colr
                          </a>{' '}
                          {t('features:settings.about.is_copyright', { defaultValue: 'es ©' })}{' '}
                          <a href="https://mozilla.org/" target="_blank" rel="noreferrer noopener">
                            Mozilla Foundation
                          </a>
                          {', '}
                          {t('features:settings.about.used_under_terms_fem', { defaultValue: 'utilizada bajo los términos de' })}{' '}
                          <a
                            href="http://www.apache.org/licenses/LICENSE-2.0"
                            target="_blank"
                            rel="noreferrer noopener"
                          >
                            Apache 2.0
                          </a>
                          .
                        </Text>
                      </li>
                      <li>
                        <Text size="T300">
                          {t('features:settings.about.the_emoji_art', { defaultValue: 'El diseño de emojis de' })}{' '}
                          <a
                            href="https://twemoji.twitter.com"
                            target="_blank"
                            rel="noreferrer noopener"
                          >
                            Twemoji
                          </a>{' '}
                          {t('features:settings.about.is_copyright', { defaultValue: 'es ©' })}{' '}
                          <a
                            href="https://twemoji.twitter.com"
                            target="_blank"
                            rel="noreferrer noopener"
                          >
                            Twitter, Inc y otros colaboradores
                          </a>
                          {', '}
                          {t('features:settings.about.used_under_terms', { defaultValue: 'utilizado bajo los términos de' })}{' '}
                          <a
                            href="https://creativecommons.org/licenses/by/4.0/"
                            target="_blank"
                            rel="noreferrer noopener"
                          >
                            CC-BY 4.0
                          </a>
                          .
                        </Text>
                      </li>
                      <li>
                        <Text size="T300">
                          {t('features:settings.about.the_sound_resources', { defaultValue: 'Los recursos de sonido de' })}{' '}
                          <a
                            href="https://material.io/design/sound/sound-resources.html"
                            target="_blank"
                            rel="noreferrer noopener"
                          >
                            Material sound resources
                          </a>{' '}
                          {t('features:settings.about.are_copyright', { defaultValue: 'son ©' })}{' '}
                          <a href="https://google.com" target="_blank" rel="noreferrer noopener">
                            Google
                          </a>
                          {', '}
                          {t('features:settings.about.used_under_terms_pl', { defaultValue: 'utilizados bajo los términos de' })}{' '}
                          <a
                            href="https://creativecommons.org/licenses/by/4.0/"
                            target="_blank"
                            rel="noreferrer noopener"
                          >
                            CC-BY 4.0
                          </a>
                          .
                        </Text>
                      </li>
                    </Box>`;
    return code.replace(oldCreditsBlock, newCreditsBlock);
  },
]);

// AD. Keybinds/Keybinds.tsx
patchFile(path.join(FRONTEND_DIR, 'src', 'app', 'features', 'settings', 'keybinds', 'Keybinds.tsx'), [
  (code) => {
    if (code.includes('function translateGestureLabel(')) return code;
    const helperFn = `function translateGestureLabel(label: string, t: (key: string, opts?: any) => string): string {
  if (label === 'Double-click') return t('features:settings.keybinds_gestures.double_click', { defaultValue: 'Doble clic' });
  if (label === 'Hold Shift') return t('features:settings.keybinds_gestures.hold_shift', { defaultValue: 'Mantener Shift' });
  if (label === 'Any character') return t('features:settings.keybinds_gestures.any_character', { defaultValue: 'Cualquier carácter' });
  if (label === 'Shift+Click') return t('features:settings.keybinds_gestures.shift_click', { defaultValue: 'Shift+Clic' });
  if (label === 'Alt+Click') return t('features:settings.keybinds_gestures.alt_click', { defaultValue: 'Alt+Clic' });
  if (label.includes('Click Delete')) {
    return label.replace('Click Delete', t('features:settings.keybinds_gestures.click_delete', { defaultValue: 'Clic en Eliminar' }));
  }
  return label;
}\n\n`;
    return helperFn + code;
  },
  (code) => ensureHookInFunc(code, 'function GestureTile({ def }: { def: KeybindDefinition }) {'),
  (code) => ensureHookInFunc(code, 'function ReadOnlyTile({ def }: { def: KeybindDefinition }) {'),
  (code) => ensureHookInFunc(code, 'function KeybindCapture({ currentKey, onCapture }: KeybindCaptureProps) {'),
  (code) => ensureHookInFunc(code, 'export function Keybinds({ requestClose }: KeybindsProps) {'),
  (code) => code.replace('title={def.description}', `title={t('features:settings.keybinds_items.' + def.id, { defaultValue: def.description })}`),
  (code) => code.replace(/<Text size="H3" truncate>\s*Keybinds\s*<\/Text>/, `<Text size="H3" truncate>{t('features:settings.keybinds', { defaultValue: 'Keybinds' })}</Text>`),
  (code) => code.replace('<Text size="B400">Reset All</Text>', `<Text size="B400">{t('features:settings.keybinds_reset_all', { defaultValue: 'Reset All' })}</Text>`),
  (code) => code.replace(/<Text size="L400">\{cat\}<\/Text>/, `<Text size="L400">{t('features:settings.keybinds_categories.' + cat.toLowerCase().replace(/\\s+/g, '_'), { defaultValue: cat })}</Text>`),
  (code) => code.replace('<Text size="T200">Reset</Text>', `<Text size="T200">{t('features:settings.reset', { defaultValue: 'Reset' })}</Text>`),
  (code) => code.replace(
    /function alternativesText\(def: KeybindDefinition[\s\S]*?\): string \| undefined \{[\s\S]*?if \(!def\.altKeys \|\| def\.altKeys\.length === 0\) return undefined;[\s\S]*?const labels = def\.altKeys\.map\([\s\S]*?\);[\s\S]*?return `Also: \$\{labels\.join\(', '\)\}`;[\s\S]*?\}/,
    `function alternativesText(def: KeybindDefinition, t: (key: string, opts?: any) => string): string | undefined {
  if (!def.altKeys || def.altKeys.length === 0) return undefined;
  const labels = def.altKeys.map((k) => (def.gesture ? translateGestureLabel(k, t) : formatKeyComboSplit(k).join(' ')));
  return \`\${t('features:settings.keybinds_also', { defaultValue: 'También: ' })}\${labels.join(', ')}\`;
}`
  ),
  (code) => code.replace(/description=\{alternativesText\(def\)\}/g, 'description={alternativesText(def, t)}'),
  (code) => code.replace(
    /<KeyCombo keys=\{def\.gesture \? \[def\.defaultKeys\] : formatKeyComboSplit\(def\.defaultKeys\)\} \/>/,
    '<KeyCombo keys={def.gesture ? [translateGestureLabel(def.defaultKeys, t)] : formatKeyComboSplit(def.defaultKeys)} />'
  ),
  (code) => code.replace(/<Text size="T200"[^>]*>\s*Press keys\.\.\.\s*<\/Text>/, `<Text size="T200" style={{ color: color.Primary.Main, fontStyle: 'italic' }}>{t('features:settings.keybinds_press_keys', { defaultValue: 'Press keys...' })}</Text>`),
]);

// AD2. KeyboardShortcuts/KeyboardShortcuts.tsx
patchFile(path.join(FRONTEND_DIR, 'src', 'app', 'features', 'keyboard-shortcuts', 'KeyboardShortcuts.tsx'), [
  (code) => {
    if (code.includes('function translateGestureLabel(')) return code;
    const helperFn = `function translateGestureLabel(label: string, t: (key: string, opts?: any) => string): string {
  if (label === 'Double-click') return t('features:settings.keybinds_gestures.double_click', { defaultValue: 'Doble clic' });
  if (label === 'Hold Shift') return t('features:settings.keybinds_gestures.hold_shift', { defaultValue: 'Mantener Shift' });
  if (label === 'Any character') return t('features:settings.keybinds_gestures.any_character', { defaultValue: 'Cualquier carácter' });
  if (label === 'Shift+Click') return t('features:settings.keybinds_gestures.shift_click', { defaultValue: 'Shift+Clic' });
  if (label === 'Alt+Click') return t('features:settings.keybinds_gestures.alt_click', { defaultValue: 'Alt+Clic' });
  if (label.includes('Click Delete')) {
    return label.replace('Click Delete', t('features:settings.keybinds_gestures.click_delete', { defaultValue: 'Clic en Eliminar' }));
  }
  return label;
}\n\n`;
    return helperFn + code;
  },
  (code) => ensureHookInFunc(code, 'export function KeyboardShortcuts({ requestClose }: KeyboardShortcutsProps) {'),
  (code) => code.replace(/<Text size="H3">\s*Keyboard Shortcuts\s*<\/Text>/, `<Text size="H3">{t('features:settings.keybinds', { defaultValue: 'Keyboard Shortcuts' })}</Text>`),
  (code) => code.replace(/<Text size="H4" style=\{\{ fontWeight: config\.fontWeight\.W600 \}\}>\s*\{cat\}\s*<\/Text>/, `<Text size="H4" style={{ fontWeight: config.fontWeight.W600 }}>{t('features:settings.keybinds_categories.' + cat.toLowerCase().replace(/\\s+/g, '_'), { defaultValue: cat })}</Text>`),
  (code) => code.replace(/\{item\.description\}/g, `{t('features:settings.keybinds_items.' + item.id, { defaultValue: item.description })}`),
  (code) => code.replace(/<Text size="T200" priority="300">\s*or\s*<\/Text>/g, `<Text size="T200" priority="300">{t('features:settings.or', { defaultValue: 'or' })}</Text>`),
  (code) => code.replace(/keys=\{item\.gesture \? \[combo\] : formatKeyComboSplit\(combo\)\}/g, `keys={item.gesture ? [translateGestureLabel(combo, t)] : formatKeyComboSplit(combo)}`),
]);

// AE. General/General.tsx
patchFile(path.join(FRONTEND_DIR, 'src', 'app', 'features', 'settings', 'general', 'General.tsx'), [
  (code) => ensureHookInFunc(code, 'function DateHint({ hasChanges, handleReset }: DateHintProps) {'),
  (code) => ensureHookInFunc(code, 'function CustomDateFormat({ value, onChange }: CustomDateFormatProps) {'),
  (code) => ensureHookInFunc(code, 'function SelectDateFormat() {'),
  (code) => code.replace('<Text size="L400">Formatting</Text>', `<Text size="L400">{t('features:settings.general.formatting', { defaultValue: 'Formatting' })}</Text>`),
  (code) => code.replace('<Text size="L400">Year</Text>', `<Text size="L400">{t('features:settings.general.year', { defaultValue: 'Year' })}</Text>`),
  (code) => code.replace(/\{': '\}\s*Two-digit year/, `{\`: \${t('features:settings.general.two_digit_year', { defaultValue: 'Two-digit year' })}\`}`),
  (code) => code.replace(/\{': '\}Four-digit year/, `{\`: \${t('features:settings.general.four_digit_year', { defaultValue: 'Four-digit year' })}\`}`),
  (code) => code.replace('<Text size="L400">Month</Text>', `<Text size="L400">{t('features:settings.general.month', { defaultValue: 'Month' })}</Text>`),
  (code) => code.replace(/\{': '\}The month/, `{\`: \${t('features:settings.general.the_month', { defaultValue: 'The month' })}\`}`),
  (code) => code.replace(/\{': '\}\s*Two-digit month/, `{\`: \${t('features:settings.general.two_digit_month', { defaultValue: 'Two-digit month' })}\`}`),
  (code) => code.replace(/\{': '\}Short month name/, `{\`: \${t('features:settings.general.short_month_name', { defaultValue: 'Short month name' })}\`}`),
  (code) => code.replace(/\{': '\}Full month name/, `{\`: \${t('features:settings.general.full_month_name', { defaultValue: 'Full month name' })}\`}`),
  (code) => code.replace('<Text size="L400">Day of the Month</Text>', `<Text size="L400">{t('features:settings.general.day_of_the', { defaultValue: 'Day of the Month' })}</Text>`),
  (code) => code.replace(/\{': '\}Day of the month/, `{\`: \${t('features:settings.general.day_of_the_month', { defaultValue: 'Day of the month' })}\`}`),
  (code) => code.replace(/\{': '\}\s*Two-digit day of the month/, `{\`: \${t('features:settings.general.two_digit_day_of_the_month', { defaultValue: 'Two-digit day of the month' })}\`}`),
  (code) => code.replace('<Text size="L400">Day of the Week</Text>', `<Text size="L400">{t('features:settings.general.day_of_the_week', { defaultValue: 'Day of the Week' })}</Text>`),
  (code) => code.replace(/\{': '\}Day of the week \(Sunday = 0\)/, `{\`: \${t('features:settings.general.day_of_the_week_sunday', { defaultValue: 'Day of the week (Sunday = 0)' })}\`}`),
  (code) => code.replace(/\{': '\}Two-letter day name/, `{\`: \${t('features:settings.general.two_letter_day_name', { defaultValue: 'Two-letter day name' })}\`}`),
  (code) => code.replace(/\{': '\}Short day name/, `{\`: \${t('features:settings.general.short_day_name', { defaultValue: 'Short day name' })}\`}`),
  (code) => code.replace(/\{': '\}Full day name/, `{\`: \${t('features:settings.general.full_day_name', { defaultValue: 'Full day name' })}\`}`),
  (code) => code.replace('<Text size="B400">Save</Text>', `<Text size="B400">{t('features:settings.general.save', { defaultValue: 'Save' })}</Text>`),
  (code) => code.replace('title="Date Format"', `title={t('features:settings.general.date_format', { defaultValue: 'Date Format' })}`),
]);

// AF. WelcomePage.tsx - Ensure clean native welcome page, no "what's new" Changelog
patchFile(path.join(FRONTEND_DIR, 'src', 'app', 'pages', 'client', 'WelcomePage.tsx'), [
  (code) => {
    if (code.includes('SIMP.Chat') && !code.includes('Changelog') && !code.includes('Bestie')) return code;
    return `import React from 'react';
import { Box, Text, config, toRem } from 'folds';
import { useTranslation } from 'react-i18next';
import { Page, PageHero, PageHeroSection } from '../../components/page';
import SimpSVG from '../../../../public/res/svg/simp.svg';

export function WelcomePage() {
  const { t } = useTranslation();

  return (
    <Page>
      <Box
        grow="Yes"
        style={{ padding: config.space.S400, paddingBottom: config.space.S700 }}
        alignItems="Center"
        justifyContent="Center"
      >
        <PageHeroSection>
          <PageHero
            icon={<img width="80" height="80" src={SimpSVG} alt="SIMP.Chat Logo" />}
            title="Bienvenido a SIMP.Chat"
            subTitle={
              <span>
                Cliente Matrix rápido, moderno y seguro
              </span>
            }
          >
            <Box justifyContent="Center">
              <Box grow="Yes" style={{ maxWidth: toRem(360) }} direction="Column" gap="300">
                <Text size="T300" priority="300" style={{ textAlign: 'center' }}>
                  {t('pages:client.select_chat_to_start', {
                    defaultValue: 'Selecciona una conversación o inicia un chat nuevo para comenzar.',
                  })}
                </Text>
              </Box>
            </Box>
          </PageHero>
        </PageHeroSection>
      </Box>
    </Page>
  );
}
`;
  },
]);

// AG. Direct Messages / Direct.tsx
patchFile(path.join(FRONTEND_DIR, 'src', 'app', 'pages', 'client', 'direct', 'Direct.tsx'), [
  (code) => code.replace('Direct Messages', 'Mensajes directos'),
  (code) => code.replace('Show unread only', 'Mostrar solo no leídos'),
  (code) => code.replace('No Direct Messages', 'Sin mensajes directos'),
  (code) => code.replace('You do not have any direct messages yet.', 'Aún no tienes ningún mensaje directo.'),
  (code) => code.replace('Direct Message', 'Mensaje directo'),
]);

// AH. Explore / Explore.tsx
patchFile(path.join(FRONTEND_DIR, 'src', 'app', 'pages', 'client', 'explore', 'Explore.tsx'), [
  (code) => code.replace('<Text size="B400">Add Server</Text>', '<Text size="B400">Agregar servidor</Text>'),
  (code) => code.replace(/<Text size="H4" truncate>\s*Explore Community\s*<\/Text>/, '<Text size="H4" truncate>Explorar comunidad</Text>'),
  (code) => code.replace(/<Text as="span" size="Inherit" truncate>\s*Featured\s*<\/Text>/, '<Text as="span" size="Inherit" truncate>Destacados</Text>'),
  (code) => code.replace(/<Text size="L400">Servers<\/Text>/, '<Text size="L400">Servidores</Text>'),
  (code) => code.replace(/<Text size="H3" truncate>\s*Add Server\s*<\/Text>/, '<Text size="H3" truncate>Agregar servidor</Text>'),
  (code) => code.replace('placeholder="example.com"', 'placeholder="ejemplo.com"'),
  (code) => code.replace('<Text size="B400">Add</Text>', '<Text size="B400">Agregar</Text>'),
  (code) => code.replace('Add to List', 'Agregar a la lista'),
  (code) => code.replace('Browse Without Adding', 'Explorar sin agregar'),
  (code) => code.replace('Remove Server', 'Eliminar servidor'),
]);

// AI. Explore / Featured.tsx
patchFile(path.join(FRONTEND_DIR, 'src', 'app', 'pages', 'client', 'explore', 'Featured.tsx'), [
  (code) => code.replace('title="Featured Communities"', 'title="Comunidades destacadas"'),
  (code) => code.replace('subTitle="Hand-picked spaces and rooms — or browse the public room directory of any Matrix server."', 'subTitle="Espacios y salas seleccionados, o explora el directorio público de cualquier servidor Matrix."'),
  (code) => code.replace('<Text size="B400">Browse public servers</Text>', '<Text size="B400">Explorar servidores públicos</Text>'),
  (code) => code.replace('Around 1,150 servers, merged daily from asra.gr, joinmatrix.org and\n                      privacydev.net.', 'Alrededor de 1.150 servidores, recopilados diariamente de asra.gr, joinmatrix.org y\n                      privacydev.net.'),
  (code) => code.replace('<Text size="H4">Featured Spaces</Text>', '<Text size="H4">Espacios destacados</Text>'),
  (code) => code.replace('<Text size="H4">Featured Rooms</Text>', '<Text size="H4">Salas destacadas</Text>'),
  (code) => code.replace('No rooms or spaces are currently featured.', 'Actualmente no hay salas ni espacios destacados.'),
]);

// AJ. Explore / Server.tsx
patchFile(path.join(FRONTEND_DIR, 'src', 'app', 'pages', 'client', 'explore', 'Server.tsx'), [
  (code) => code.replace("title: 'All'", "title: 'Todo'"),
  (code) => code.replace("title: 'Spaces'", "title: 'Espacios'"),
  (code) => code.replace("title: 'Rooms'", "title: 'Salas'"),
  (code) => code.replace('<Text size="L400">Search</Text>', '<Text size="L400">Buscar</Text>'),
  (code) => code.replace('placeholder="Search for keyword"', 'placeholder="Buscar por palabra clave"'),
  (code) => code.replace('<Text size="B300">Clear</Text>', '<Text size="B300">Limpiar</Text>'),
  (code) => code.replace('<Text size="B300">Enter</Text>', '<Text size="B300">Buscar</Text>'),
  (code) => code.replace('<Text style={{ padding: config.space.S100 }} size="L400" truncate>\n                Protocols\n              </Text>', '<Text style={{ padding: config.space.S100 }} size="L400" truncate>\n                Protocolos\n              </Text>'),
  (code) => code.replace('<Text size="L400">Presets</Text>', '<Text size="L400">Predefinidos</Text>'),
  (code) => code.replace('<Text size="L400">Custom Limit</Text>', '<Text size="L400">Límite personalizado</Text>'),
  (code) => code.replace('aria-label="Per Page Item Limit"', 'aria-label="Límite por página"'),
  (code) => code.replace('<Text size="B300">Change Limit</Text>', '<Text size="B300">Cambiar límite</Text>'),
  (code) => code.replace('{`Page Limit: ${limit}`}', '{`Límite: ${limit}`}'),
  (code) => code.replace('<Text size="H3" truncate>\n                Search\n              </Text>', '<Text size="H3" truncate>\n                Buscar\n              </Text>'),
  (code) => code.replace('<Text size="H4">{`Results for "${serverSearchParams.term}"`}</Text>', '<Text size="H4">{`Resultados para "${serverSearchParams.term}"`}</Text>'),
  (code) => code.replace('<Text size="H4">Popular Communities</Text>', '<Text size="H4">Comunidades populares</Text>'),
  (code) => code.replace('Previous Page', 'Página anterior'),
  (code) => code.replace('Next Page', 'Página siguiente'),
  (code) => code.replace('No communities found!', '¡No se encontraron comunidades!'),
]);

// AK. Inbox / Inbox.tsx
patchFile(path.join(FRONTEND_DIR, 'src', 'app', 'pages', 'client', 'inbox', 'Inbox.tsx'), [
  (code) => code.replace('<Text as="span" size="Inherit" truncate>\n                Invites\n              </Text>', '<Text as="span" size="Inherit" truncate>\n                Invitaciones\n              </Text>'),
  (code) => code.replace('<Text size="H4" truncate>\n              Inbox\n            </Text>', '<Text size="H4" truncate>\n              Bandeja de entrada\n            </Text>'),
  (code) => code.replace('<Text as="span" size="Inherit" truncate>\n                        All\n                      </Text>', '<Text as="span" size="Inherit" truncate>\n                        Todo\n                      </Text>'),
  (code) => code.replace('<Text as="span" size="Inherit" truncate>\n                        Notifications\n                      </Text>', '<Text as="span" size="Inherit" truncate>\n                        Notificaciones\n                      </Text>'),
]);

// AL. Inbox / All.tsx
patchFile(path.join(FRONTEND_DIR, 'src', 'app', 'pages', 'client', 'inbox', 'All.tsx'), [
  (code) => code.replace('title="All"', 'title="Todo"'),
  (code) => code.replace('<Text size="H4">Invites</Text>', '<Text size="H4">Invitaciones</Text>'),
]);

// AM. Inbox / Notifications.tsx
patchFile(path.join(FRONTEND_DIR, 'src', 'app', 'pages', 'client', 'inbox', 'Notifications.tsx'), [
  (code) => code.replace("title = 'Notification Messages'", "title = 'Mensajes de notificación'"),
  (code) => code.replace('<Text size="T200">Mark as Read</Text>', '<Text size="T200">Marcar como leído</Text>'),
  (code) => code.replace('<Text size="T200">Open</Text>', '<Text size="T200">Abrir</Text>'),
  (code) => code.replace('<Text size="L400">Filter</Text>', '<Text size="L400">Filtro</Text>'),
  (code) => code.replace('<Text size="T200">All Notifications</Text>', '<Text size="T200">Todas las notificaciones</Text>'),
  (code) => code.replace('<Text size="T200">Highlighted</Text>', '<Text size="T200">Menciones</Text>'),
  (code) => code.replace('aria-label="Scroll to Top"', 'aria-label="Ir arriba"'),
  (code) => code.replace('<Text>No Notifications</Text>', '<Text>Sin notificaciones</Text>'),
  (code) => code.replace("You don&apos;t have any new notifications to display yet.", 'Aún no tienes notificaciones nuevas para mostrar.'),
]);

// AN. Inbox / Invites.tsx
patchFile(path.join(FRONTEND_DIR, 'src', 'app', 'pages', 'client', 'inbox', 'Invites.tsx'), [
  (code) => code.replace('<Text size="L400">Encrypted</Text>', '<Text size="L400">Cifrado</Text>'),
  (code) => code.replace('<Text size="L400">Direct Message</Text>', '<Text size="L400">Mensaje directo</Text>'),
  (code) => code.replace('<Text size="L400">Space</Text>', '<Text size="L400">Espacio</Text>'),
  (code) => code.replace('<Text size="B300">Decline</Text>', '<Text size="B300">Rechazar</Text>'),
  (code) => code.replace('<Text size="B300">Accept</Text>', '<Text size="B300">Aceptar</Text>'),
  (code) => code.replace('From: <b>{invite.senderId}</b>', 'De: <b>{invite.senderId}</b>'),
  (code) => code.replace('Reason: {invite.reason}', 'Motivo: {invite.reason}'),
  (code) => code.replace('<Text size="T200">All</Text>', '<Text size="T200">Todo</Text>'),
  (code) => code.replace('<Text size="T200">Primary</Text>', '<Text size="T200">Principal</Text>'),
  (code) => code.replace('<Text size="T200">Public</Text>', '<Text size="T200">Público</Text>'),
  (code) => code.replace('<Text size="T200">Spam</Text>', '<Text size="T200">Spam</Text>'),
  (code) => code.replace('<Text size="H4">Primary</Text>', '<Text size="H4">Principal</Text>'),
  (code) => code.replace('title="No Invites"\n              subTitle="When someone you share a room with sends you an invite, it’ll show up here."', 'title="Sin invitaciones"\n              subTitle="Cuando alguien con quien compartes una sala te envíe una invitación, aparecerá aquí."'),
  (code) => code.replace('<Text size="H4">Public</Text>', '<Text size="H4">Público</Text>'),
  (code) => code.replace('<Text size="T200">Decline All</Text>', '<Text size="T200">Rechazar todas</Text>'),
  (code) => code.replace('title="No Invites"\n              subTitle="Invites from people outside your rooms will appear here."', 'title="Sin invitaciones"\n              subTitle="Las invitaciones de personas fuera de tus salas aparecerán aquí."'),
  (code) => code.replace('title={`${invites.length} Spam Invites`}', 'title={`${invites.length} invitaciones marcadas como spam`}'),
  (code) => code.replace('subTitle="Some of the following invites may contain harmful content or have been sent by banned users."', 'subTitle="Algunas de las siguientes invitaciones pueden contener contenido dañino o haber sido enviadas por usuarios bloqueados."'),
  (code) => code.replace('Decline All', 'Rechazar todas'),
  (code) => code.replace('Report All', 'Reportar todas'),
  (code) => code.replace('Block All', 'Bloquear todos'),
  (code) => code.replace("{showInvites ? 'Hide All' : 'View All'}", "{showInvites ? 'Ocultar todas' : 'Ver todas'}"),
  (code) => code.replace('title="No Spam Invites"', 'title="Sin invitaciones no deseadas"'),
  (code) => code.replace('subTitle="Invites detected as spam appear here."', 'subTitle="Las invitaciones detectadas como spam aparecerán aquí."'),
  (code) => code.replace('title="No Invites"\n              subTitle="Invites to rooms and spaces will show up here."', 'title="Sin invitaciones"\n              subTitle="Las invitaciones a salas y espacios aparecerán aquí."'),
  (code) => code.replace('<Text size="H3" truncate>\n              Invites\n            </Text>', '<Text size="H3" truncate>\n              Invitaciones\n            </Text>'),
]);

// AO. Nav / DirectsNav.tsx
patchFile(path.join(FRONTEND_DIR, 'src', 'app', 'pages', 'client', 'nav', 'DirectsNav.tsx'), [
  (code) => code.replace('Create Chat', 'Crear chat'),
]);

// AP. Nav / RoomsNav.tsx
patchFile(path.join(FRONTEND_DIR, 'src', 'app', 'pages', 'client', 'nav', 'RoomsNav.tsx'), [
  (code) => code.replace('Create Room', 'Crear sala'),
  (code) => code.replace('Join with Address', 'Unirse con dirección'),
  (code) => code.replace('Message Search', 'Buscar mensajes'),
  (code) => code.replace('<Text size="H4" truncate>\n              Rooms\n            </Text>', '<Text size="H4" truncate>\n              Salas\n            </Text>'),
]);

// AQ. Nav / NavMenuItems.tsx
patchFile(path.join(FRONTEND_DIR, 'src', 'app', 'pages', 'client', 'nav', 'NavMenuItems.tsx'), [
  (code) => code.replace('Mark as Read', 'Marcar como leído'),
]);

// AR. TopBar.tsx
patchFile(path.join(FRONTEND_DIR, 'src', 'app', 'pages', 'client', 'TopBar.tsx'), [
  (code) => code.replace('aria-label="Inbox"', 'aria-label="Bandeja de entrada"'),
  (code) => code.replace('<Tooltip>Inbox</Tooltip>', '<Tooltip>Bandeja de entrada</Tooltip>'),
]);

// AS. Home.tsx & Rooms.tsx
patchFile(path.join(FRONTEND_DIR, 'src', 'app', 'pages', 'client', 'home', 'Home.tsx'), [
  (code) => code.replace('No Direct Messages', 'Sin mensajes directos'),
  (code) => code.replace('You do not have any direct messages yet.', 'Aún no tienes ningún mensaje directo.'),
]);
patchFile(path.join(FRONTEND_DIR, 'src', 'app', 'pages', 'client', 'rooms', 'Rooms.tsx'), [
  (code) => code.replace('No Rooms', 'Sin salas'),
  (code) => code.replace('You do not have any rooms yet.', 'Aún no tienes ninguna sala.'),
]);

// AT. Room / message / MessageEditor.tsx
patchFile(path.join(FRONTEND_DIR, 'src', 'app', 'features', 'room', 'message', 'MessageEditor.tsx'), [
  (code) => code.replace('placeholder="Edit message..."', 'placeholder="Editar mensaje..."'),
  (code) => code.replace('<Text size="B300">Cancel</Text>', '<Text size="B300">Cancelar</Text>'),
  (code) => code.replace('<Text size="B300">Save</Text>', '<Text size="B300">Guardar</Text>'),
]);

// AU. Room / RoomViewHeader.tsx (Call tooltips)
patchFile(path.join(FRONTEND_DIR, 'src', 'app', 'features', 'room', 'RoomViewHeader.tsx'), [
  (code) => code.replace("Already in another call — End the current call to join!", "Ya estás en otra llamada — ¡Finaliza la llamada actual para unirte!"),
  (code) => code.replace("Your homeserver does not advertise a LiveKit/MatrixRTC focus, so calls cannot be started.", "Tu servidor no anuncia un foco LiveKit/MatrixRTC, por lo que no se pueden iniciar llamadas."),
  (code) => code.replace("You do not have permission to start a call in this room.", "No tienes permiso para iniciar una llamada en esta sala."),
  (code) => code.replace("blocker ?? 'Start voice call'", "blocker ?? 'Iniciar llamada de voz'"),
  (code) => code.replace('aria-label="Start voice call"', 'aria-label="Iniciar llamada de voz"'),
  (code) => code.replace("blocker ?? 'Start video call'", "blocker ?? 'Iniciar videollamada'"),
  (code) => code.replace('aria-label="Start video call"', 'aria-label="Iniciar videollamada"'),
]);

// AV. Features / call / CallView.tsx
patchFile(path.join(FRONTEND_DIR, 'src', 'app', 'features', 'call', 'CallView.tsx'), [
  (code) => code.replace('Your homeserver does not support calling.', 'Tu servidor no soporta llamadas.'),
  (code) => code.replace('Your browser does not support WebRTC, which is required for calling.', 'Tu navegador no soporta WebRTC, requerido para realizar llamadas.'),
  (code) => code.replace('Voice chat’s empty — Be the first to hop in!', 'El chat de voz está vacío — ¡Sé el primero en unirte!'),
  (code) => code.replace('You don&#39;t have permission to join!', '¡No tienes permiso para unirte!'),
  (code) => code.replace('Already in another call — End the current call to join!', 'Ya estás en otra llamada — ¡Finaliza la llamada actual para unirte!'),
  (code) => code.replace('<Text size="L400">Participant</Text>', '<Text size="L400">Participantes</Text>'),
  (code) => code.replace('{callMembers.length} Live', '{callMembers.length} en vivo'),
]);

// AW. Features / call / Controls.tsx
patchFile(path.join(FRONTEND_DIR, 'src', 'app', 'features', 'call', 'Controls.tsx'), [
  (code) => code.replace("enabled ? 'Turn Off Microphone' : 'Turn On Microphone'", "enabled ? 'Desactivar micrófono' : 'Activar micrófono'"),
  (code) => code.replace("enabled ? 'Turn Off Sound' : 'Turn On Sound'", "enabled ? 'Silenciar sonido' : 'Activar sonido'"),
  (code) => code.replace("enabled ? 'Stop Camera' : 'Start Camera'", "enabled ? 'Detener cámara' : 'Iniciar cámara'"),
  (code) => code.replace("enabled ? 'Stop Screenshare' : 'Start Screenshare'", "enabled ? 'Dejar de compartir pantalla' : 'Compartir pantalla'"),
  (code) => code.replace("chat ? 'Close Chat' : 'Open Chat'", "chat ? 'Cerrar chat' : 'Abrir chat'"),
]);

// AX. Features / call / PrescreenControls.tsx
patchFile(path.join(FRONTEND_DIR, 'src', 'app', 'features', 'call', 'PrescreenControls.tsx'), [
  (code) => code.replace('<Text size="B400">Join</Text>', '<Text size="B400">Unirse</Text>'),
]);

// AY. Features / call / CallControls.tsx
patchFile(path.join(FRONTEND_DIR, 'src', 'app', 'features', 'call', 'CallControls.tsx'), [
  (code) => code.replace("spotlight ? 'Grid View' : 'Spotlight View'", "spotlight ? 'Vista de cuadrícula' : 'Vista de enfoque'"),
  (code) => code.replace('<Text size="B300" truncate>\n                          Reactions\n                        </Text>', '<Text size="B300" truncate>\n                          Reacciones\n                        </Text>'),
  (code) => code.replace('<Text size="B300" truncate>\n                          Settings\n                        </Text>', '<Text size="B300" truncate>\n                          Configuración\n                        </Text>'),
  (code) => code.replace('<Text size="B400">End</Text>', '<Text size="B400">Finalizar</Text>'),
]);

// AZ. Components / CallEmbedProvider.tsx
patchFile(path.join(FRONTEND_DIR, 'src', 'app', 'components', 'CallEmbedProvider.tsx'), [
  (code) => code.replace('Incoming Call', 'Llamada entrante'),
  (code) => code.replace('Your homeserver does not support calling.', 'Tu servidor no soporta llamadas.'),
  (code) => code.replace('Your browser does not support WebRTC, which is required for calling.', 'Tu navegador no soporta WebRTC, requerido para realizar llamadas.'),
  (code) => code.replace('<Text as="span" size="B400">\n                      Answer\n                    </Text>', '<Text as="span" size="B400">\n                      Responder\n                    </Text>'),
  (code) => code.replace("dm ? 'Reject' : 'Ignore'", "dm ? 'Rechazar' : 'Ignorar'"),
]);

// BA. Room / CallChatView.tsx
patchFile(path.join(FRONTEND_DIR, 'src', 'app', 'features', 'room', 'CallChatView.tsx'), [
  (code) => code.replace('<Text>Close</Text>', '<Text>Cerrar</Text>'),
]);

console.log('\n🎉 ¡Parche integral completado con éxito!');
