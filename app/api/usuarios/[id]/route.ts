import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import { AuthOptions, getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import bcrypt from 'bcryptjs';

async function getSession(authOptions: AuthOptions) {
    return getServerSession(authOptions);
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {



        const { id } = await params;
        const session = await getSession(authOptions);

        if (session?.user?.role !== "ADMIN") {
            return NextResponse.json(
                { message: "Acesso negado" },
                { status: 403 }
            );
        }

        if (!session) {
            return NextResponse.json(
                { message: 'Acesso negado. Você precisa estar autenticado.' },
                { status: 401 }
            );
        }

        if (session.user?.role !== 'ADMIN') {
            return NextResponse.json(
                { message: 'Acesso negado. Apenas administradores podem visualizar usuários.' },
                { status: 403 }
            );
        }

        await connectDB();

        const usuario = await User.findById(id).select('-password -tecnicoData');

        if (!usuario) {
            return NextResponse.json({ message: 'Usuário não encontrado.' }, { status: 404 });
        }

        return NextResponse.json({ usuario }, { status: 200 });
    } catch (error) {
        console.error('Erro ao buscar usuário:', error);
        return NextResponse.json(
            { message: error instanceof Error ? error.message : 'Erro ao buscar usuário' },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await getSession(authOptions);

        if (session?.user?.role !== "ADMIN") {
            return NextResponse.json(
                { message: "Acesso negado" },
                { status: 403 }
            );
        }

        if (!session) {
            return NextResponse.json(
                { message: 'Acesso negado. Você precisa estar autenticado.' },
                { status: 401 }
            );
        }

        if (session.user?.role !== 'ADMIN') {
            return NextResponse.json(
                { message: 'Acesso negado. Apenas administradores podem editar usuários.' },
                { status: 403 }
            );
        }

        await connectDB();

        const usuario = await User.findById(id);

        if (!usuario) {
            return NextResponse.json({ message: 'Usuário não encontrado.' }, { status: 404 });
        }

        const body = await request.json();
        const updateData: Record<string, any> = {};

        if (body.nome) {
            updateData.nome = body.nome;
        }

        if (body.role) {
            if (!['ADMIN', 'PADRAO'].includes(body.role)) {
                return NextResponse.json(
                    { message: 'Perfil inválido. Use "ADMIN" ou "PADRAO".' },
                    { status: 400 }
                );
            }
            updateData.role = body.role;
        }

        if (typeof body.isAtivo === 'boolean') {
            updateData.isAtivo = body.isAtivo;
        }

        if (body.email && body.email !== usuario.email) {
            const existing = await User.findOne({ email: body.email });
            if (existing) {
                return NextResponse.json(
                    { message: 'Já existe um usuário com este e-mail.' },
                    { status: 409 }
                );
            }
            updateData.email = body.email;
        }

        if (body.password) {
            if (body.password.length < 8) {
                return NextResponse.json(
                    { message: 'Senha deve ter no mínimo 8 caracteres.' },
                    { status: 400 }
                );
            }
            updateData.password = await bcrypt.hash(body.password, 10);
        }

        const updated = await User.findByIdAndUpdate(id, updateData, {
            new: true,
            runValidators: true,
        }).select('-password -tecnicoData');

        return NextResponse.json(
            { message: 'Usuário atualizado com sucesso.', usuario: updated },
            { status: 200 }
        );
    } catch (error) {
        console.error('Erro ao atualizar usuário:', error);
        return NextResponse.json(
            { message: error instanceof Error ? error.message : 'Erro ao atualizar usuário' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await getSession(authOptions);

        if (session?.user?.role !== "ADMIN") {
            return NextResponse.json(
                { message: "Acesso negado" },
                { status: 403 }
            );
        }

        if (!session) {
            return NextResponse.json(
                { message: 'Acesso negado. Você precisa estar autenticado.' },
                { status: 401 }
            );
        }

        if (session.user?.role !== 'ADMIN') {
            return NextResponse.json(
                { message: 'Acesso negado. Apenas administradores podem inativar usuários.' },
                { status: 403 }
            );
        }

        if (session.user?.id === id) {
            return NextResponse.json(
                { message: 'Você não pode inativar sua própria conta.' },
                { status: 400 }
            );
        }

        await connectDB();

        const usuario = await User.findById(id);

        if (!usuario) {
            return NextResponse.json({ message: 'Usuário não encontrado.' }, { status: 404 });
        }

        usuario.isAtivo = false;
        await usuario.save();

        return NextResponse.json({ message: 'Usuário inativado com sucesso.' }, { status: 200 });
    } catch (error) {
        console.error('Erro ao inativar usuário:', error);
        return NextResponse.json(
            { message: error instanceof Error ? error.message : 'Erro ao inativar usuário' },
            { status: 500 }
        );
    }
}
