import React, { useState, useEffect } from 'react';
import { Users, LoaderCircle } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';

interface Profile {
  id: string;
  created_at: string;
  full_name: string;
  email: string;
}

const UsersPage: React.FC = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProfiles = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('id, created_at, full_name, email')
        .order('created_at', { ascending: false });

      if (error) {
        toast.error('Falha ao buscar utilizadores.');
        console.error(error);
      } else {
        setProfiles(data as Profile[]);
      }
      setIsLoading(false);
    };

    fetchProfiles();
  }, []);

  return (
    <div className="flex-1 p-6 lg:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Usuários</h1>
          <p className="text-gray-600 dark:text-gray-400">Gerencie todos os utilizadores registados na plataforma.</p>
        </div>
      </div>

      <div className="bg-light-card dark:bg-dark-card rounded-xl border border-light-border dark:border-dark-border">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Lista de Usuários</h2>
        </div>
        {isLoading ? (
          <div className="flex justify-center items-center h-60">
            <LoaderCircle className="h-8 w-8 animate-spin text-brand-primary" />
          </div>
        ) : profiles.length === 0 ? (
          <div className="text-center py-10 px-6 border-t border-light-border dark:border-dark-border">
            <Users className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
            <h3 className="mt-2 text-lg font-semibold text-gray-900 dark:text-white">Nenhum usuário encontrado</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Ainda não há utilizadores registados.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-dark-border/20 dark:text-gray-400">
                <tr>
                  <th scope="col" className="px-6 py-3">Nome Completo</th>
                  <th scope="col" className="px-6 py-3">E-mail</th>
                  <th scope="col" className="px-6 py-3">Data de Registo</th>
                </tr>
              </thead>
              <tbody>
                {profiles.map(profile => (
                  <tr key={profile.id} className="bg-white dark:bg-dark-card border-b dark:border-dark-border hover:bg-gray-50 dark:hover:bg-dark-card/50">
                    <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                      {profile.full_name}
                    </td>
                    <td className="px-6 py-4">{profile.email}</td>
                    <td className="px-6 py-4">{new Date(profile.created_at).toLocaleDateString('pt-BR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default UsersPage;
