# 🛒 SMARTcart

SMARTcart es una moderna aplicación web de gestión clínica y hospitalaria diseñada para el control, optimización y seguimiento en tiempo real del inventario, carritos de curas, botiquines y técnicas médicas.

## 🚀 Tecnologías Principales

El proyecto ha sido construido utilizando tecnologías web modernas:

- **Frontend:** [React 19](https://react.dev/)
- **Empaquetador/Linter:** [Vite](https://vitejs.dev/)
- **Lenguaje:** [TypeScript](https://www.typescriptlang.org/)
- **Estilos e Interfaz:** [Tailwind CSS](https://tailwindcss.com/) & [Lucide Icons](https://lucide.dev/)
- **Base de Datos & Autenticación:** [Supabase](https://supabase.com/) (PostgreSQL)
- **IA Integrada:** Integración con API de Gemini (AI Studio)

## ✨ Características y Optimizaciones
- **Gestión Visual de Inventario:** Catálogo completo de materiales con imágenes, códigos de referencia y localizaciones precisas.
- **Módulo de Técnicas/Protocolos:** Permite a los enfermeros vincular materiales específicos a distintas técnicas médicas y seguir checklists de preparación.
- **Rendimiento Acelerado:** Arquitectura optimizada con *Code-Splitting* (`React.lazy`) que reduce en un 80% el peso de la carga inicial.
- **Experiencia de Usuario (UX) Pulida:** Paginación de base de datos eficiente y debounce en buscadores inteligentes para evitar saturación de memoria en dispositivos móviles.

---

## 💻 Entorno de Desarrollo Local

Si deseas correr este proyecto de forma local para modificarlo o probar las funciones en tu entorno:

### 1. Clonar y preparar

Abre tu terminal y ejecuta los siguientes comandos:

```bash
git clone https://github.com/oacgijon-eng/SMARTcart.git
cd SMARTcart
npm install
```

### 2. Variables de entorno

Crea un archivo llamado `.env.local` en la carpeta raíz del proyecto y añade tus credenciales. Debería tener un aspecto similar a este:

```env
VITE_SUPABASE_URL=tu_url_de_supabase_aqui
VITE_SUPABASE_ANON_KEY=tu_clave_anon_de_supabase_aqui
GEMINI_API_KEY=tu_api_key_de_gemini
```

### 3. Ejecutar la aplicación

Inicia el servidor de desarrollo ultrarrápido (Vite):

```bash
npm run dev
```

La aplicación estará corriendo normalmente en `http://localhost:5173`.

---

## 🛠️ Despliegue en Vercel

SMARTcart está preparado e integrado para **[Vercel](https://vercel.com/)**.
Cada vez que subes un cambio (`git push origin master`) al repositorio oficial de GitHub, Vercel compila tus cambios ejecutando automáticamente `npm run build` y los empuja a tu producción, de forma 100% automatizada.

*Recuerda añadir las variables de entorno de tu archivo `.env.local` directamente en los ajustes del proyecto de Vercel (Project Settings -> Environment Variables).*

---

> Aplicación desarrollada e iterada para agilidad del personal médico en inventarios.
