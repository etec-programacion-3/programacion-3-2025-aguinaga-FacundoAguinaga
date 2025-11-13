import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Envolvemos todo en una función que exportamos para poder pasarle io y activeUsers
export default (io, activeUsers) => {
  const router = Router();

  // --- RUTA DE REGISTRO (no necesita cambios) ---
  router.post('/register', async (req, res) => {
    try {
      const { email, username, password } = req.body;
      if (!email || !username || !password) {
        return res.status(400).json({ error: 'Todos los campos son requeridos' });
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: {
          email,
          username,
          password: hashedPassword,
        },
      });
      res.status(201).json({ id: user.id, username: user.username });
    } catch (error) {
      if (error.code === 'P2002') {
        return res.status(409).json({ error: 'El email o nombre de usuario ya existe' });
      }
      res.status(500).json({ error: 'Error al registrar el usuario' });
    }
  });
  
// --- RUTA DE LOGIN (SIMPLIFICADA) ---
router.post('/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
      return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }

    const isEmail = identifier.includes('@');
    const whereClause = isEmail ? { email: identifier } : { username: identifier };

    const user = await prisma.user.findUnique({ where: whereClause });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    // Genera el nuevo token (SIN LÓGICA DE KICK AQUÍ)
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );
    
    res.json({ token });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

return router;
};