# Noise Pomodoro

[日本語](README.ja.md) | [English](README.md) | [Français](README.fr.md) | [中文](README.zh.md)

Genera ruido blanco, rosa y marrón, tonos isocrónicos, pulsaciones binaurales y frecuencias solfeggio, con soporte para reproducir archivos de audio locales y ejecutar código JavaScript personalizado para generar formas de onda. Incluye un temporizador Pomodoro integrado que permite asignar un sonido diferente a los periodos de concentración y descanso.

## Capturas de pantalla

<table>
<tr>
<td align="center" width="33%"><img src="images/screenshots/main-panel.png" width="280" alt="Vista predeterminada del panel" /><br />Vista predeterminada</td>
<td align="center" width="33%"><img src="images/screenshots/playing-preset.png" width="280" alt="Un preset reproduciéndose" /><br />Preset reproduciéndose</td>
<td align="center" width="33%"><img src="images/screenshots/pomodoro.png" width="280" alt="Temporizador Pomodoro en curso" /><br />Pomodoro en curso</td>
</tr>
</table>

## Funciones

- **Fuentes de sonido generadas**: Ruido blanco, rosa y marrón, tonos isocrónicos, pulsaciones binaurales y frecuencias solfeggio, todo generado en un AudioWorklet para una reproducción sin cortes durante la interacción con la interfaz.
- **Reproducción de archivos**: Reproduce un archivo de audio local de tu elección.
- **Código personalizado**: Escribe una expresión JavaScript usando `t` (segundos transcurridos) y `params` (parámetros arbitrarios) para generar una forma de onda en el rango de -1 a 1 y reproducirla al instante.
- **Temporizador Pomodoro**: Configura la duración de concentración y descanso de forma independiente y asigna un sonido a cada fase. Admite cambio automático de fase, un aviso al finalizar la fase, un sonido único (chime) y scripts personalizados.
- **Centrado en la barra de estado**: Abre el panel desde la barra de estado. La reproducción continúa aunque cierres el panel, y la barra de estado sigue siendo tu punto de control incluso en modo Zen.

## Uso

1. Haz clic en el icono de la barra de estado, o ejecuta "Noise Pomodoro: Open Panel" desde la paleta de comandos, para abrir el panel.
2. Elige un preset de sonido para iniciar la reproducción.
3. En la sección Pomodoro, configura las duraciones de concentración/descanso y el sonido de cada fase, y luego presiona Start.

## Pruebas (para contribuidores)

Si es tu primera vez desarrollando una extensión, comprobar las cosas en este orden puede ayudar:

1. Ejecuta `npm install` en la terminal.
2. Ejecuta `npm run watch` para que los cambios en el código fuente se recompilen automáticamente.
3. Presiona F5 en VS Code para iniciar el Extension Development Host.
4. En la nueva ventana, abre la paleta de comandos y ejecuta "Noise Pomodoro: Open Panel".
5. Prueba lo siguiente en orden:
	- Selecciona un preset y confirma que suena.
	- Confirma que la reproducción continúa después de cerrar el panel.
	- Confirma que la barra de estado muestra el nombre del preset que se está reproduciendo.
	- Opera el Pomodoro con Start / Pause / Reset / Skip y confirma que la pantalla y el estado se mantienen sincronizados.
	- Si existe un preset de reproducción de archivo, confirma que puedes seleccionar y reproducir un archivo de audio local.
	- Si existe el modo de código personalizado, introduce una expresión simple, aplícala y confirma que aparece un mensaje de error si falla.
6. Para consultar los registros, abre el canal de salida "Noise Pomodoro" en VS Code.
7. Después de hacer cambios, repite la verificación en el host de desarrollo F5: vuelve a mostrar el panel para cambios de interfaz, o espera la recompilación de watch y vuelve a probar para cambios de implementación.

## Configuración

- `noisePomodoro.enablePhaseEndScripts`: Permite ejecutar scripts personalizados al finalizar una fase. Por defecto `false`. Se ejecuta con privilegios del extension host / Node, así que usa solo scripts que hayas escrito tú mismo.
- `noisePomodoro.statusBar.updateIntervalMs`: Intervalo de actualización de la barra de estado del Pomodoro, en milisegundos. Por defecto `1000`.

## Desarrollo

```bash
npm install
npm run watch
```

Presiona F5 en VS Code para iniciar el Extension Development Host.
