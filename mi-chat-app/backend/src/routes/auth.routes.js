import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { email, username, password } = req.body;

  try {
    // Hashear la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear el usuario en la base de datos
    const user = await prisma.user.create({
      data: { email, username, password: hashedPassword },
    });

    res.status(201).json({ message: 'Usuario registrado exitosamente', user });
  } catch (error) {
    console.error('Error en /register:', error);
    if (error.code === 'P2002') {
      // Error de clave única (email o username ya existen)
      return res.status(400).json({ error: 'El email o nombre de usuario ya está registrado' });
    }
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Buscar al usuario por email
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Comparar contraseñas
    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (!isPasswordCorrect) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // --- MODIFICACIÓN CLAVE ---
    // Generar el token JWT incluyendo id, email y username
    const token = jwt.sign(
      { id: user.id, email: user.email, username: user.username }, // Payload actualizado
      'your-secret-key', // Reemplazar con variable de entorno en producción
      {
        expiresIn: '1h',
      }
    );

    res.json({ message: 'Inicio de sesión exitoso', token });
  } catch (error) {
    console.error('Error en /login:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;