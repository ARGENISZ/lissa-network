const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pool = require('./db');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Carpeta para guardar imágenes
const uploadsPath = path.join(__dirname, 'uploads');

if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath);
}

app.use('/uploads', express.static(uploadsPath));

// Configuración para imágenes
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsPath);
  },
  filename: function (req, file, cb) {
    const nombreLimpio = file.originalname.replace(/\s+/g, '-');
    const nombreUnico = Date.now() + '-' + nombreLimpio;
    cb(null, nombreUnico);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 2 * 1024 * 1024
  },
  fileFilter: function (req, file, cb) {
    const formatosPermitidos = ['image/jpeg', 'image/png', 'image/webp'];

    if (formatosPermitidos.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes JPG, PNG o WEBP'));
    }
  }
});

// ==============================
// PROBAR CONEXIÓN
// ==============================
app.get('/api/probar-db', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT 1 AS conectado');

    res.json({
      ok: true,
      mensaje: 'Conexión correcta a MySQL',
      data: rows
    });

  } catch (error) {
    res.status(500).json({
      ok: false,
      mensaje: 'Error conectando a MySQL',
      error: error.message
    });
  }
});

// ==============================
// ENTRADAS
// ==============================
app.post('/api/entradas', upload.single('imagen'), async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const {
      nombre,
      categoria,
      codigo,
      proveedor,
      costo,
      unidades,
      fecha,
      factura,
      imagenActual
    } = req.body;

    const imagen = req.file ? req.file.filename : (imagenActual || null);
    const unidadesEntrada = Number(unidades || 0);

    if (!codigo || !nombre) {
      return res.status(400).json({
        ok: false,
        mensaje: 'Código y nombre son obligatorios'
      });
    }

    if (isNaN(unidadesEntrada) || unidadesEntrada <= 0) {
      return res.status(400).json({
        ok: false,
        mensaje: 'Las unidades deben ser mayores a cero'
      });
    }

    await connection.beginTransaction();

    // 1. Guardar historial de entrada
    const sqlEntrada = `
      INSERT INTO entradas (
        nombre,
        categoria,
        codigo,
        proveedor,
        costo,
        unidades,
        fecha,
        factura,
        imagen
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await connection.query(sqlEntrada, [
      nombre,
      categoria,
      codigo,
      proveedor,
      costo || 0,
      unidadesEntrada,
      fecha || null,
      factura,
      imagen
    ]);

    // 2. Actualizar inventario acumulado
    const sqlInventario = `
      INSERT INTO inventario (
        codigo,
        nombre,
        categoria,
        proveedor,
        costo,
        factura,
        imagen,
        en_existencia
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        nombre = VALUES(nombre),
        categoria = VALUES(categoria),
        proveedor = VALUES(proveedor),
        costo = VALUES(costo),
        factura = VALUES(factura),
        imagen = COALESCE(VALUES(imagen), imagen),
        en_existencia = en_existencia + VALUES(en_existencia)
    `;

    await connection.query(sqlInventario, [
      codigo,
      nombre,
      categoria,
      proveedor,
      costo || 0,
      factura,
      imagen,
      unidadesEntrada
    ]);

    await connection.commit();

    res.json({
      ok: true,
      mensaje: 'Entrada registrada correctamente e inventario actualizado'
    });

  } catch (error) {
    await connection.rollback();

    res.status(500).json({
      ok: false,
      mensaje: 'Error al registrar entrada',
      error: error.message
    });

  } finally {
    connection.release();
  }
});

app.get('/api/entradas', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT *
      FROM entradas
      ORDER BY id DESC
    `);

    res.json(rows);

  } catch (error) {
    res.status(500).json({
      ok: false,
      mensaje: 'Error al obtener entradas',
      error: error.message
    });
  }
});


// ==============================
// INVENTARIO
// ==============================
app.get('/api/inventario', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        codigo,
        nombre,
        categoria,
        proveedor,
        en_existencia AS enExistencia,
        status
      FROM inventario
      ORDER BY nombre ASC
    `);

    res.json(rows);

  } catch (error) {
    res.status(500).json({
      ok: false,
      mensaje: 'Error al obtener inventario',
      error: error.message
    });
  }
});

// ==============================
// REPORTE DE INVENTARIO
// ==============================
app.get('/api/inventario/reporte', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        i.codigo,
        i.nombre,
        i.categoria,
        i.proveedor,
        COALESCE(e.total_entradas, 0) AS entradas,
        COALESCE(s.total_salidas, 0) AS salidas,
        i.en_existencia AS enExistencia,
        i.status
      FROM inventario i
      LEFT JOIN (
        SELECT 
          codigo,
          SUM(COALESCE(unidades, 0)) AS total_entradas
        FROM entradas
        GROUP BY codigo
      ) e ON e.codigo = i.codigo
      LEFT JOIN (
        SELECT 
          codigo,
          SUM(COALESCE(unidades, 0)) AS total_salidas
        FROM salidas
        GROUP BY codigo
      ) s ON s.codigo = i.codigo
      ORDER BY i.nombre ASC
    `);

    res.json(rows);

  } catch (error) {
    res.status(500).json({
      ok: false,
      mensaje: 'Error al generar reporte de inventario',
      error: error.message
    });
  }
});

// ==============================
// BUSCAR PRODUCTO EN INVENTARIO POR CÓDIGO
// ==============================
app.get('/api/inventario/codigo/:codigo', async (req, res) => {
  try {
    const { codigo } = req.params;

    const [rows] = await pool.query(`
      SELECT
        id,
        codigo,
        nombre,
        categoria,
        proveedor,
        costo,
        factura,
        imagen,
        en_existencia AS unidades,
        status
      FROM inventario
      WHERE codigo = ?
      LIMIT 1
    `, [codigo]);

    if (rows.length === 0) {
      return res.status(404).json({
        ok: false,
        mensaje: 'Producto no encontrado en inventario'
      });
    }

    res.json({
      ok: true,
      producto: rows[0]
    });

  } catch (error) {
    res.status(500).json({
      ok: false,
      mensaje: 'Error al buscar producto en inventario',
      error: error.message
    });
  }
});

// ==============================
// BUSCAR PRODUCTO POR CÓDIGO
// ==============================
app.get('/api/productos/codigo/:codigo', async (req, res) => {
  try {
    const { codigo } = req.params;

    const [rows] = await pool.query(`
      SELECT 
        id,
        nombre,
        categoria,
        codigo,
        proveedor,
        costo,
        unidades,
        DATE_FORMAT(fecha, '%Y-%m-%d') AS fecha,
        factura,
        imagen
      FROM entradas
      WHERE codigo = ?
      ORDER BY id DESC
      LIMIT 1
    `, [codigo]);

    if (rows.length === 0) {
      return res.status(404).json({
        ok: false,
        mensaje: 'Producto no encontrado'
      });
    }

    res.json({
      ok: true,
      producto: rows[0]
    });

  } catch (error) {
    res.status(500).json({
      ok: false,
      mensaje: 'Error al buscar producto',
      error: error.message
    });
  }
});


app.get('/api/salidas', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        id,
        DATE_FORMAT(fecha, '%Y-%m-%d') AS fecha,
        folio,
        tecnico,
        factura,
        codigo,
        nombre,
        categoria,
        proveedor,
        disponibles,
        unidades,
        imagen,
        creado_en
      FROM salidas
      ORDER BY id DESC
    `);

    res.json(rows);

  } catch (error) {
    res.status(500).json({
      ok: false,
      mensaje: 'Error al obtener historial de salidas',
      error: error.message
    });
  }
});

// ==============================
// ACTUALIZAR ENTRADA EXISTENTE
// ==============================
app.put('/api/entradas/:id', upload.single('imagen'), async (req, res) => {
  try {
    const { id } = req.params;

    const {
      nombre,
      categoria,
      codigo,
      proveedor,
      costo,
      unidades,
      fecha,
      factura
    } = req.body;

    if (!id) {
      return res.status(400).json({
        ok: false,
        mensaje: 'El ID del producto es obligatorio'
      });
    }

    const sql = `
      UPDATE entradas
      SET
        nombre = ?,
        categoria = ?,
        codigo = ?,
        proveedor = ?,
        costo = ?,
        unidades = ?,
        fecha = ?,
        factura = ?
      WHERE id = ?
    `;

    const [resultado] = await pool.query(sql, [
      nombre,
      categoria,
      codigo,
      proveedor,
      costo || 0,
      unidades || 0,
      fecha || null,
      factura,
      id
    ]);

    if (resultado.affectedRows === 0) {
      return res.status(404).json({
        ok: false,
        mensaje: 'No se encontró el producto para actualizar'
      });
    }

    res.json({
      ok: true,
      mensaje: 'Producto actualizado correctamente'
    });

  } catch (error) {
    res.status(500).json({
      ok: false,
      mensaje: 'Error al actualizar producto',
      error: error.message
    });
  }
});

// ==============================
// LOGIN
// ==============================
app.post('/api/login', async (req, res) => {
  try {
    const { usuario, contrasena } = req.body;

    if (!usuario || !contrasena) {
      return res.status(400).json({
        ok: false,
        mensaje: 'Usuario y contraseña son obligatorios'
      });
    }

    const [rows] = await pool.query(`
      SELECT 
        id,
        nombre_completo,
        usuario,
        correo,
        telefono,
        estado,
        rol
      FROM usuarios
      WHERE usuario = ?
        AND contrasena = ?
      LIMIT 1
    `, [usuario, contrasena]);

    if (rows.length === 0) {
      return res.status(401).json({
        ok: false,
        mensaje: 'Usuario o contraseña incorrectos'
      });
    }

    const usuarioEncontrado = rows[0];

    if (usuarioEncontrado.estado !== 'Activo') {
      return res.status(403).json({
        ok: false,
        mensaje: 'El usuario está inactivo'
      });
    }

    let permisos = [];

    if (usuarioEncontrado.rol === 'Administrador') {
      permisos = [
        { modulo: 'usuarios', puede_ver: true, puede_crear: true, puede_editar: true, puede_eliminar: true },
        { modulo: 'categorias', puede_ver: true, puede_crear: true, puede_editar: true, puede_eliminar: true },
        { modulo: 'proveedores', puede_ver: true, puede_crear: true, puede_editar: true, puede_eliminar: true },
        { modulo: 'inventario', puede_ver: true, puede_crear: true, puede_editar: true, puede_eliminar: true },
        { modulo: 'nueva_entrada', puede_ver: true, puede_crear: true, puede_editar: true, puede_eliminar: true },
        { modulo: 'nueva_salida', puede_ver: true, puede_crear: true, puede_editar: true, puede_eliminar: true },
        { modulo: 'historial_entradas', puede_ver: true, puede_crear: true, puede_editar: true, puede_eliminar: true },
        { modulo: 'historial_ventas', puede_ver: true, puede_crear: true, puede_editar: true, puede_eliminar: true },
        { modulo: 'punto_venta', puede_ver: true, puede_crear: true, puede_editar: true, puede_eliminar: true },
        { modulo: 'atencion_cliente', puede_ver: true, puede_crear: true, puede_editar: true, puede_eliminar: true }
      ];
    } else {
      const [permisosRows] = await pool.query(`
  SELECT 
    modulo,
    puede_ver,
    puede_crear,
    puede_editar,
    puede_eliminar
  FROM permisos_usuario
  WHERE id_usuario = ?
`, [usuarioEncontrado.id]);

permisos = permisosRows.map(p => ({
  modulo: p.modulo,
  puede_ver: Boolean(p.puede_ver),
  puede_crear: Boolean(p.puede_crear),
  puede_editar: Boolean(p.puede_editar),
  puede_eliminar: Boolean(p.puede_eliminar)
}));
    }

    res.json({
      ok: true,
      mensaje: 'Login correcto',
      usuario: usuarioEncontrado,
      permisos
    });

  } catch (error) {
    res.status(500).json({
      ok: false,
      mensaje: 'Error en el login',
      error: error.message
    });
  }
});

// ==============================
// SALIDAS
// ==============================
app.post('/api/salidas', upload.none(), async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const {
      fecha,
      folio,
      tecnico,
      factura,
      codigo,
      nombre,
      categoria,
      proveedor,
      unidades,
      imagen
    } = req.body;

    if (!fecha || !folio || !tecnico || !codigo || !nombre) {
      return res.status(400).json({
        ok: false,
        mensaje: 'Faltan campos obligatorios'
      });
    }

    const unidadesSalida = Number(unidades);

    if (isNaN(unidadesSalida) || unidadesSalida <= 0) {
      return res.status(400).json({
        ok: false,
        mensaje: 'Las unidades deben ser mayores a cero'
      });
    }

    await connection.beginTransaction();

    // 1. Buscar existencia real en inventario
    const [productoRows] = await connection.query(`
      SELECT en_existencia
      FROM inventario
      WHERE codigo = ?
      FOR UPDATE
    `, [codigo]);

    if (productoRows.length === 0) {
      await connection.rollback();

      return res.status(404).json({
        ok: false,
        mensaje: 'Producto no encontrado en inventario'
      });
    }

    const unidadesDisponibles = Number(productoRows[0].en_existencia);

    if (unidadesSalida > unidadesDisponibles) {
      await connection.rollback();

      return res.status(400).json({
        ok: false,
        mensaje: 'No hay suficientes unidades disponibles'
      });
    }

    // 2. Guardar historial de salida
    const sqlSalida = `
      INSERT INTO salidas (
        fecha,
        folio,
        tecnico,
        factura,
        codigo,
        nombre,
        categoria,
        proveedor,
        disponibles,
        unidades,
        imagen
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await connection.query(sqlSalida, [
      fecha || null,
      folio,
      tecnico,
      factura,
      codigo,
      nombre,
      categoria,
      proveedor,
      unidadesDisponibles,
      unidadesSalida,
      imagen || null
    ]);

    // 3. Descontar del inventario
    await connection.query(`
      UPDATE inventario
      SET en_existencia = en_existencia - ?
      WHERE codigo = ?
    `, [unidadesSalida, codigo]);

    await connection.commit();

    res.json({
      ok: true,
      mensaje: 'Salida registrada correctamente e inventario actualizado'
    });

  } catch (error) {
    await connection.rollback();

    res.status(500).json({
      ok: false,
      mensaje: 'Error al registrar salida',
      error: error.message
    });

  } finally {
    connection.release();
  }
});

// ==============================
// CATEGORÍAS
// ==============================
app.get('/api/categorias', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        id,
        nombre_categoria AS categoria,
        creado_en
      FROM categorias
      ORDER BY id DESC
    `);

    res.json(rows);

  } catch (error) {
    res.status(500).json({
      ok: false,
      mensaje: 'Error al obtener categorías',
      error: error.message
    });
  }
});

app.post('/api/categorias', async (req, res) => {
  try {
    const { categoria } = req.body;

    if (!categoria || !categoria.trim()) {
      return res.status(400).json({
        ok: false,
        mensaje: 'El nombre de la categoría es obligatorio'
      });
    }

    await pool.query(
      'INSERT INTO categorias (nombre_categoria) VALUES (?)',
      [categoria.trim()]
    );

    res.json({
      ok: true,
      mensaje: 'Categoría guardada correctamente'
    });

  } catch (error) {
    res.status(500).json({
      ok: false,
      mensaje: 'Error al guardar categoría',
      error: error.message
    });
  }
});

app.put('/api/categorias/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { categoria } = req.body;

    if (!categoria || !categoria.trim()) {
      return res.status(400).json({
        ok: false,
        mensaje: 'El nombre de la categoría es obligatorio'
      });
    }

    await pool.query(
      'UPDATE categorias SET nombre_categoria = ? WHERE id = ?',
      [categoria.trim(), id]
    );

    res.json({
      ok: true,
      mensaje: 'Categoría actualizada correctamente'
    });

  } catch (error) {
    res.status(500).json({
      ok: false,
      mensaje: 'Error al actualizar categoría',
      error: error.message
    });
  }
});

app.delete('/api/categorias/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query(
      'DELETE FROM categorias WHERE id = ?',
      [id]
    );

    res.json({
      ok: true,
      mensaje: 'Categoría eliminada correctamente'
    });

  } catch (error) {
    res.status(500).json({
      ok: false,
      mensaje: 'Error al eliminar categoría',
      error: error.message
    });
  }
});

// ==============================
// PROVEEDORES
// ==============================
app.get('/api/proveedores', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        id,
        nombre,
        domicilio,
        telefono,
        correo,
        rfc,
        creado_en
      FROM proveedores
      ORDER BY id DESC
    `);

    res.json(rows);

  } catch (error) {
    res.status(500).json({
      ok: false,
      mensaje: 'Error al obtener proveedores',
      error: error.message
    });
  }
});

app.post('/api/proveedores', async (req, res) => {
  try {
    const {
      nombre,
      domicilio,
      telefono,
      correo,
      rfc
    } = req.body;

    if (!nombre || !nombre.trim()) {
      return res.status(400).json({
        ok: false,
        mensaje: 'El nombre del proveedor es obligatorio'
      });
    }

    const sql = `
      INSERT INTO proveedores (
        nombre,
        domicilio,
        telefono,
        correo,
        rfc
      )
      VALUES (?, ?, ?, ?, ?)
    `;

    await pool.query(sql, [
      nombre.trim(),
      domicilio,
      telefono,
      correo,
      rfc
    ]);

    res.json({
      ok: true,
      mensaje: 'Proveedor guardado correctamente'
    });

  } catch (error) {
    res.status(500).json({
      ok: false,
      mensaje: 'Error al guardar proveedor',
      error: error.message
    });
  }
});

app.put('/api/proveedores/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const {
      nombre,
      domicilio,
      telefono,
      correo,
      rfc
    } = req.body;

    if (!nombre || !nombre.trim()) {
      return res.status(400).json({
        ok: false,
        mensaje: 'El nombre del proveedor es obligatorio'
      });
    }

    const sql = `
      UPDATE proveedores
      SET 
        nombre = ?,
        domicilio = ?,
        telefono = ?,
        correo = ?,
        rfc = ?
      WHERE id = ?
    `;

    await pool.query(sql, [
      nombre.trim(),
      domicilio,
      telefono,
      correo,
      rfc,
      id
    ]);

    res.json({
      ok: true,
      mensaje: 'Proveedor actualizado correctamente'
    });

  } catch (error) {
    res.status(500).json({
      ok: false,
      mensaje: 'Error al actualizar proveedor',
      error: error.message
    });
  }
});

app.delete('/api/proveedores/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query(
      'DELETE FROM proveedores WHERE id = ?',
      [id]
    );

    res.json({
      ok: true,
      mensaje: 'Proveedor eliminado correctamente'
    });

  } catch (error) {
    res.status(500).json({
      ok: false,
      mensaje: 'Error al eliminar proveedor',
      error: error.message
    });
  }
});

// ==============================
// USUARIOS
// ==============================
app.get('/api/usuarios', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        id,
        nombre_completo,
        usuario,
        correo,
        telefono,
        estado,
        creado_en
      FROM usuarios
      ORDER BY id DESC
    `);

    res.json(rows);

  } catch (error) {
    res.status(500).json({
      ok: false,
      mensaje: 'Error al obtener usuarios',
      error: error.message
    });
  }
});

app.post('/api/usuarios', async (req, res) => {
  try {
    const {
      nombre_completo,
      usuario,
      correo,
      telefono,
      contrasena,
      estado
    } = req.body;

    if (!nombre_completo || !usuario || !contrasena) {
      return res.status(400).json({
        ok: false,
        mensaje: 'Nombre, usuario y contraseña son obligatorios'
      });
    }

    const sql = `
      INSERT INTO usuarios (
        nombre_completo,
        usuario,
        correo,
        telefono,
        contrasena,
        estado
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    await pool.query(sql, [
      nombre_completo,
      usuario,
      correo,
      telefono,
      contrasena,
      estado || 'Activo'
    ]);

    res.json({
      ok: true,
      mensaje: 'Usuario guardado correctamente'
    });

  } catch (error) {
    res.status(500).json({
      ok: false,
      mensaje: 'Error al guardar usuario',
      error: error.message
    });
  }
});

app.put('/api/usuarios/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const {
      nombre_completo,
      usuario,
      correo,
      telefono,
      contrasena,
      estado
    } = req.body;

    if (!nombre_completo || !usuario) {
      return res.status(400).json({
        ok: false,
        mensaje: 'Nombre y usuario son obligatorios'
      });
    }

    if (contrasena && contrasena.trim() !== '') {
      await pool.query(`
        UPDATE usuarios
        SET 
          nombre_completo = ?,
          usuario = ?,
          correo = ?,
          telefono = ?,
          contrasena = ?,
          estado = ?
        WHERE id = ?
      `, [
        nombre_completo,
        usuario,
        correo,
        telefono,
        contrasena,
        estado,
        id
      ]);
    } else {
      await pool.query(`
        UPDATE usuarios
        SET 
          nombre_completo = ?,
          usuario = ?,
          correo = ?,
          telefono = ?,
          estado = ?
        WHERE id = ?
      `, [
        nombre_completo,
        usuario,
        correo,
        telefono,
        estado,
        id
      ]);
    }

    res.json({
      ok: true,
      mensaje: 'Usuario actualizado correctamente'
    });

  } catch (error) {
    res.status(500).json({
      ok: false,
      mensaje: 'Error al actualizar usuario',
      error: error.message
    });
  }
});

app.delete('/api/usuarios/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query(
      'DELETE FROM usuarios WHERE id = ?',
      [id]
    );

    res.json({
      ok: true,
      mensaje: 'Usuario eliminado correctamente'
    });

  } catch (error) {
    res.status(500).json({
      ok: false,
      mensaje: 'Error al eliminar usuario',
      error: error.message
    });
  }
});

// ==============================
// ROLES DE USUARIO
// ==============================

// Obtener un usuario por ID
app.get('/api/usuarios/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query(`
      SELECT 
        id,
        nombre_completo,
        usuario,
        correo,
        telefono,
        estado,
        rol,
        creado_en
      FROM usuarios
      WHERE id = ?
    `, [id]);

    if (rows.length === 0) {
      return res.status(404).json({
        ok: false,
        mensaje: 'Usuario no encontrado'
      });
    }

    res.json(rows[0]);

  } catch (error) {
    res.status(500).json({
      ok: false,
      mensaje: 'Error al obtener usuario',
      error: error.message
    });
  }
});

// Asignar rol a usuario
app.put('/api/usuarios/:id/rol', async (req, res) => {
  try {
    const { id } = req.params;
    const { rol } = req.body;

    if (!rol) {
      return res.status(400).json({
        ok: false,
        mensaje: 'Debe seleccionar un rol'
      });
    }

    if (rol !== 'Administrador' && rol !== 'Normal') {
      return res.status(400).json({
        ok: false,
        mensaje: 'Rol no válido'
      });
    }

    await pool.query(
      'UPDATE usuarios SET rol = ? WHERE id = ?',
      [rol, id]
    );

    res.json({
      ok: true,
      mensaje: 'Rol asignado correctamente'
    });

  } catch (error) {
    res.status(500).json({
      ok: false,
      mensaje: 'Error al asignar rol',
      error: error.message
    });
  }
});

// ==============================
// PERMISOS DE USUARIO
// ==============================
const modulosSistema = [
  { modulo: 'usuarios', nombre: 'Usuarios' },
  { modulo: 'categorias', nombre: 'Categorías' },
  { modulo: 'proveedores', nombre: 'Proveedores' },
  { modulo: 'inventario', nombre: 'Inventario' },
  { modulo: 'nueva_entrada', nombre: 'Nueva Entrada' },
  { modulo: 'nueva_salida', nombre: 'Nueva Salida' },
  { modulo: 'historial_entradas', nombre: 'Historial de Entradas' },
  { modulo: 'historial_ventas', nombre: 'Historial de Ventas' },
  { modulo: 'punto_venta', nombre: 'Punto de Venta' },
  { modulo: 'atencion_cliente', nombre: 'Atención al Cliente' }
];

// Obtener permisos de un usuario
app.get('/api/usuarios/:id/permisos', async (req, res) => {
  try {
    const { id } = req.params;

    const [usuarios] = await pool.query(`
      SELECT 
        id,
        nombre_completo,
        usuario,
        correo,
        telefono,
        estado,
        rol
      FROM usuarios
      WHERE id = ?
    `, [id]);

    if (usuarios.length === 0) {
      return res.status(404).json({
        ok: false,
        mensaje: 'Usuario no encontrado'
      });
    }

    const usuario = usuarios[0];
    const esAdministrador = usuario.rol === 'Administrador';

    const permisosBase = modulosSistema.map(mod => ({
      modulo: mod.modulo,
      nombre: mod.nombre,
      puede_ver: esAdministrador,
      puede_crear: esAdministrador,
      puede_editar: esAdministrador,
      puede_eliminar: esAdministrador
    }));

    if (esAdministrador) {
      return res.json({
        ok: true,
        usuario,
        permisos: permisosBase
      });
    }

    const [permisosGuardados] = await pool.query(`
      SELECT 
        modulo,
        puede_ver,
        puede_crear,
        puede_editar,
        puede_eliminar
      FROM permisos_usuario
      WHERE id_usuario = ?
    `, [id]);

    const permisos = permisosBase.map(mod => {
      const encontrado = permisosGuardados.find(p => p.modulo === mod.modulo);

      if (!encontrado) {
        return mod;
      }

      return {
        modulo: mod.modulo,
        nombre: mod.nombre,
        puede_ver: Boolean(encontrado.puede_ver),
        puede_crear: Boolean(encontrado.puede_crear),
        puede_editar: Boolean(encontrado.puede_editar),
        puede_eliminar: Boolean(encontrado.puede_eliminar)
      };
    });

    res.json({
      ok: true,
      usuario,
      permisos
    });

  } catch (error) {
    res.status(500).json({
      ok: false,
      mensaje: 'Error al obtener permisos',
      error: error.message
    });
  }
});

// Guardar permisos de un usuario
app.put('/api/usuarios/:id/permisos', async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const { id } = req.params;
    const { permisos } = req.body;

    if (!Array.isArray(permisos)) {
      return res.status(400).json({
        ok: false,
        mensaje: 'Debe enviar una lista de permisos'
      });
    }

    const [usuarios] = await connection.query(`
      SELECT id, rol
      FROM usuarios
      WHERE id = ?
    `, [id]);

    if (usuarios.length === 0) {
      return res.status(404).json({
        ok: false,
        mensaje: 'Usuario no encontrado'
      });
    }

    if (usuarios[0].rol === 'Administrador') {
      return res.json({
        ok: true,
        mensaje: 'El usuario administrador tiene acceso completo por defecto'
      });
    }

    await connection.beginTransaction();

    for (const permiso of permisos) {
      const puedeCrear = permiso.puede_crear ? 1 : 0;
      const puedeEditar = permiso.puede_editar ? 1 : 0;
      const puedeEliminar = permiso.puede_eliminar ? 1 : 0;

      // Si puede crear, editar o eliminar, automáticamente también puede ver
      const puedeVer = permiso.puede_ver || puedeCrear || puedeEditar || puedeEliminar ? 1 : 0;

      await connection.query(`
        INSERT INTO permisos_usuario (
          id_usuario,
          modulo,
          puede_ver,
          puede_crear,
          puede_editar,
          puede_eliminar
        )
        VALUES (?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          puede_ver = VALUES(puede_ver),
          puede_crear = VALUES(puede_crear),
          puede_editar = VALUES(puede_editar),
          puede_eliminar = VALUES(puede_eliminar)
      `, [
        id,
        permiso.modulo,
        puedeVer,
        puedeCrear,
        puedeEditar,
        puedeEliminar
      ]);
    }

    await connection.commit();

    res.json({
      ok: true,
      mensaje: 'Permisos guardados correctamente'
    });

  } catch (error) {
    await connection.rollback();

    res.status(500).json({
      ok: false,
      mensaje: 'Error al guardar permisos',
      error: error.message
    });

  } finally {
    connection.release();
  }
});

// ==============================
// ATENCIÓN AL CLIENTE
// ==============================

// Obtener todos los reportes
app.get('/api/atencion-cliente', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        id,
        nombre_cliente AS nombreCliente,
        identidad,
        numero_contrato AS numeroContrato,
        telefono,
        descripcion_problema AS descripcionProblema,
        estado,
        creado_en AS creadoEn
      FROM atencion_cliente
      ORDER BY id DESC
    `);

    res.json(rows);

  } catch (error) {
    res.status(500).json({
      ok: false,
      mensaje: 'Error al obtener reportes de atención al cliente',
      error: error.message
    });
  }
});

// Guardar reporte desde WordPress o desde otro formulario
app.post('/api/atencion-cliente', async (req, res) => {
  try {
    const nombreCliente = req.body.nombreCliente || req.body.nombre_cliente;
    const identidad = req.body.identidad;
    const numeroContrato = req.body.numeroContrato || req.body.numero_contrato;
    const telefono = req.body.telefono;
    const descripcionProblema = req.body.descripcionProblema || req.body.descripcion_problema;
    const estado = req.body.estado || 'Pendiente';

    if (!nombreCliente || !nombreCliente.trim()) {
      return res.status(400).json({
        ok: false,
        mensaje: 'El nombre del cliente es obligatorio'
      });
    }

    if (!descripcionProblema || !descripcionProblema.trim()) {
      return res.status(400).json({
        ok: false,
        mensaje: 'La descripción del problema es obligatoria'
      });
    }

    const sql = `
      INSERT INTO atencion_cliente (
        nombre_cliente,
        identidad,
        numero_contrato,
        telefono,
        descripcion_problema,
        estado
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    await pool.query(sql, [
      nombreCliente.trim(),
      identidad || '',
      numeroContrato || '',
      telefono || '',
      descripcionProblema.trim(),
      estado
    ]);

    res.json({
      ok: true,
      mensaje: 'Reporte guardado correctamente'
    });

  } catch (error) {
    res.status(500).json({
      ok: false,
      mensaje: 'Error al guardar reporte de atención al cliente',
      error: error.message
    });
  }
});

// Actualizar reporte
app.put('/api/atencion-cliente/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const nombreCliente = req.body.nombreCliente || req.body.nombre_cliente;
    const identidad = req.body.identidad;
    const numeroContrato = req.body.numeroContrato || req.body.numero_contrato;
    const telefono = req.body.telefono;
    const descripcionProblema = req.body.descripcionProblema || req.body.descripcion_problema;
    const estado = req.body.estado || 'Pendiente';

    if (!nombreCliente || !nombreCliente.trim()) {
      return res.status(400).json({
        ok: false,
        mensaje: 'El nombre del cliente es obligatorio'
      });
    }

    if (!descripcionProblema || !descripcionProblema.trim()) {
      return res.status(400).json({
        ok: false,
        mensaje: 'La descripción del problema es obligatoria'
      });
    }

    const sql = `
      UPDATE atencion_cliente
      SET
        nombre_cliente = ?,
        identidad = ?,
        numero_contrato = ?,
        telefono = ?,
        descripcion_problema = ?,
        estado = ?
      WHERE id = ?
    `;

    await pool.query(sql, [
      nombreCliente.trim(),
      identidad || '',
      numeroContrato || '',
      telefono || '',
      descripcionProblema.trim(),
      estado,
      id
    ]);

    res.json({
      ok: true,
      mensaje: 'Reporte actualizado correctamente'
    });

  } catch (error) {
    res.status(500).json({
      ok: false,
      mensaje: 'Error al actualizar reporte de atención al cliente',
      error: error.message
    });
  }
});

// Eliminar reporte
app.delete('/api/atencion-cliente/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query(
      'DELETE FROM atencion_cliente WHERE id = ?',
      [id]
    );

    res.json({
      ok: true,
      mensaje: 'Reporte eliminado correctamente'
    });

  } catch (error) {
    res.status(500).json({
      ok: false,
      mensaje: 'Error al eliminar reporte de atención al cliente',
      error: error.message
    });
  }
});

// ==============================
// MANEJO DE ERRORES DE MULTER
// ==============================
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    return res.status(400).json({
      ok: false,
      mensaje: 'Error al subir imagen',
      error: error.message
    });
  }

  if (error) {
    return res.status(400).json({
      ok: false,
      mensaje: error.message || 'Error en la solicitud'
    });
  }

  next();
});

// ==============================
// INICIAR SERVIDOR
// ==============================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});