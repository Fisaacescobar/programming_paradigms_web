## Mini sitio JS/HTML

Pequeña app web sin dependencias para mostrar en JavaScript:
- Imperativo vs Funcional (mismas métricas implementadas de dos formas)
- **OOP** con clases `Dataset` y `Analyzer`
- **Async/await** con una carga simulada (agrega +50 ítems)
- Gráfico con **Canvas 2D** y tabla previa

## Estructura
```
programming_paradigms_web/
  index.html   # UI y estilos
  app.js       # lógica: datos, análisis, eventos y dibujo en canvas
```

## Cómo correr
**Opción A (rápida):** abre `index.html` en tu navegador (doble click) o con la extensión **Live Server** en VS Code.  
**Opción B (servidor local):**
```bash
cd programming_paradigms_web
python -m http.server 5500
# navega a: http://localhost:5500/
```
*(Con Node puedes usar `npx serve .` o `npx http-server -p 5500`)*

## Uso
1. **Generar datos**: crea un dataset del tamaño elegido.
2. **Analizar (imp vs func)**: calcula métricas por ambos enfoques y dibuja el gráfico.
3. **Cargar asincrónicamente (+50)**: simula un `fetch`, agrega registros y re-analiza.
4. **Limpiar**: resetea la app.

## Qué se calcula
- Promedio de **precio** y **rating**
- **Mínimo/Máximo** de precio
- **Precio promedio por categoría**
- Gráfico de barras de **precio promedio por categoría**

## Notas
- Código sin frameworks (vanilla JS + HTML + CSS).
- Funciona vía `file://` (no hay `fetch` real), pero se recomienda server local para un flujo más cómodo.
- Si no ves el gráfico, primero presiona **Generar datos** y luego **Analizar**.

