# PilaLog · Logística de la estancia

Del río Pilagá a la estancia. Una app instalable (PWA) con estilo gauchesco para
que **Papá arme la lista** de lo que hace falta en la estancia y **Javier**
compre, compare precios y lleve todo cada mes.

## Cómo funciona

| | Papá | Javier |
|---|---|---|
| Agregar / editar / eliminar pedidos | ✔ | ✔ |
| Ver el estado (Pedido → Comprado → Llevado) | ✔ | ✔ y lo cambia |
| Marcar "no se consiguió" (con motivo) | ve el aviso | ✔ |
| Cargar precios de varios lugares y comparar | – | ✔ |
| Total estimado, ya comprado, ahorro y "dónde comprar" | – | ✔ |
| Fecha del próximo viaje + cuenta regresiva | ✔ | ✔ |
| Mandar la lista por WhatsApp / copiar / imprimir PDF | ✔ | ✔ |
| Cerrar el viaje (historial + lo pendiente pasa al mes siguiente) | – | ✔ |

- **La lista está siempre viva**: Papá agrega cosas cuando se acuerda, no hay un
  mensaje mensual que quede viejo.
- **Al cerrar el viaje**, lo llevado pasa al historial y lo que no llegó queda
  en la lista marcado como *"Del mes pasado"*.
- **Pedidos de siempre**: al agregar, la app sugiere lo que ya se pidió antes
  (yerba, sal, etc.) para no tener que escribir.
- **Sin señal**: los cambios se guardan en el aparato y se suben solos cuando
  vuelve la conexión (Starlink en casa, pero igual por si se corta).
- Papá no ve los precios salvo que Javier active "Que Papá vea los gastos en el
  historial" (Ajustes).

## Archivos

```
index.html            la página
styles.css            estilo gauchesco (cuero, crema, bordó, oro)
app.js                toda la lógica de la app
backend.js            datos: modo prueba (local) o Firebase
firebase-config.js    ← acá pegás los datos de tu proyecto Firebase
firestore.rules       reglas de seguridad para pegar en Firebase
sw.js                 service worker (modo sin conexión)
manifest.webmanifest  datos de instalación
icons/ fonts/         íconos y tipografías (todo incluido, no usa CDN para fuentes)
```

## Probarla ahora mismo (modo prueba)

Sin tocar nada, la app funciona en **modo prueba**: guarda en el propio teléfono
(sirve para ver cómo es y cargar ejemplos), pero **no se comparte con Papá**.
Para probarla en la compu:

```bash
cd pilalog
python3 -m http.server 8080
# abrir http://localhost:8080
```

(El service worker y la instalación requieren `localhost` o HTTPS; abrir el
`index.html` con doble clic no alcanza.)

## Ponerla en marcha de verdad (compartida con Papá)

### 1. Crear el proyecto en Firebase (gratis)

1. Entrá a <https://console.firebase.google.com> → **Crear un proyecto** → nombre
   `pilalog` (podés desactivar Google Analytics).
2. **Compilación → Firestore Database → Crear base de datos** → ubicación
   `southamerica-east1` (São Paulo) → **modo de producción**.
3. Pestaña **Reglas** → borrá lo que haya, pegá el contenido de
   [`firestore.rules`](firestore.rules) → **Publicar**.
4. **Configuración del proyecto (⚙) → Tus apps → `</>` Web** → registrá la app
   como `PilaLog` → copiá el objeto `firebaseConfig`.
5. Pegá esos valores en [`firebase-config.js`](firebase-config.js) (reemplazando
   los `PEGAR_AQUI`).

No hace falta activar Authentication ni Storage. El plan gratuito (Spark)
alcanza de sobra para una lista familiar.

### 2. Publicarla (GitHub Pages)

1. Creá un repositorio (por ejemplo `pilalog`) y subí **todo el contenido de esta
   carpeta**.
2. **Settings → Pages →** *Deploy from a branch* → rama `main` / carpeta `/ (root)`.
3. En un minuto queda en `https://TU-USUARIO.github.io/pilalog/`.

### 3. Conectar a Papá

1. En tu teléfono, abrí la URL en **Chrome** → **"Soy Javier"**.
2. **Ajustes →** cargá los dos números de WhatsApp.
3. **Ajustes → "Mandar el link por WhatsApp"** → se lo mandás a Papá.
4. Papá abre el link **en Chrome** (no en el navegador propio de Xiaomi) y toca el
   botón verde **"Instalar PilaLog"** que aparece arriba de la lista. Queda un
   ícono en su pantalla de inicio y ya ve la lista. (Si el botón no aparece, la
   app le muestra los pasos: ⋮ → Instalar aplicación.)
5. Si Papá ve la letra chica: **Ajustes → Tamaño de letra → Grande / Enorme**.

El **código de la estancia** (Ajustes) es lo que une los aparatos. Guardalo: si
cambiás de teléfono, entrás con "Entrar como Javier" y ese código (o el link).

## Avisos: qué hace y qué no

- **Avisos dentro de la app**: cuando el otro cambia la lista aparece un cartel, y
  cuando se acerca el viaje (por defecto 3 días antes) aparece un recordatorio
  en la lista.
- **Notificaciones del teléfono** (se activan en Ajustes): salen cuando se abre la
  app o está en segundo plano. Xiaomi/MIUI cierra las apps agresivamente: si
  querés que funcionen mejor, en *Ajustes del teléfono → Apps → Chrome → Ahorro de
  batería* poné **"Sin restricciones"**.
- **WhatsApp**: el botón "Mandar por WhatsApp" abre el chat con la lista armada.
  Es el aviso más confiable.
- **Notificaciones push con la app totalmente cerrada** (que lleguen solas, como
  WhatsApp) necesitan un servidor que las envíe (Cloud Functions + Firebase Cloud
  Messaging), y eso pide pasar el proyecto al plan Blaze (con tarjeta, aunque el
  uso de esta app seguiría costando $0). No está incluido; se puede agregar
  después si hace falta.

## Seguridad y privacidad

- Los datos viven en Firestore bajo un **código secreto** que genera la app
  (`pila-` + 12 letras/números al azar). Las reglas no dejan listar códigos: hay
  que conocer el código exacto. Es "seguridad por link secreto": ideal para una
  lista familiar, no para datos sensibles. No compartas el link fuera de la
  familia.
- Ocultar los precios a Papá es una decisión de la interfaz, no un candado
  criptográfico.
- La `apiKey` de Firebase para web no es un secreto (identifica el proyecto); lo
  que protege los datos son las reglas.

## Respaldo

**Ajustes → Descargar respaldo (.json)** guarda todo (lista, historial, ajustes).
**Restaurar un respaldo** lo vuelve a cargar sin borrar lo existente.

## Actualizar la app

Si cambiás archivos y los volvés a subir, subí también el número de `VERSION` en
[`sw.js`](sw.js) (`pilalog-v1` → `pilalog-v2`) para que los teléfonos tomen la
versión nueva.

---

PilaLog 1.0 · hecho por RED.
