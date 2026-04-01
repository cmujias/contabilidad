import React, { useState, useEffect } from 'react';
import { Users, Building, Plus, Trash2, Edit2, Shield, KeyRound, X, Check } from 'lucide-react';
import { 
  getEmpresasAPI, createEmpresaAPI, updateEmpresaAPI, deleteEmpresaAPI,
  getUsersAPI, createUserAPI, updateUserAPI, deleteUserAPI, updatePasswordAPI
} from '../api';

const MODULES_LIST = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'charts',    label: 'Gráficos' },
  { id: 'table',     label: 'Tabla' },
  { id: 'payments',  label: 'Pagos' },
  { id: 'builder',   label: 'Constructor' }
];

export default function AdminPanel() {
  const [empresas, setEmpresas] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Formularios Create
  const [nuevaEmpresa, setNuevaEmpresa] = useState('');
  const [nuevoUsuario, setNuevoUsuario] = useState({
    username: '', password: '', role: 'user', empresa_id: '', modules: MODULES_LIST.map(m => m.id)
  });

  // Modal States
  const [editEmpresa, setEditEmpresa] = useState(null);
  const [editUser, setEditUser] = useState(null);
  const [passUser, setPassUser] = useState(null);
  
  // Custom Alerts / Confirms
  const [message, setMessage] = useState(null); // { type: 'error' | 'success', text: str }
  const [deletingUser, setDeletingUser] = useState(null);
  const [deletingEmpresa, setDeletingEmpresa] = useState(null);

  const showMsg = (text, type = 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 5000);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      // Agregar un sufijo aleatorio para evitar cache agresivo en GET
      const cacheBust = `?t=${new Date().getTime()}`;
      const [empRes, usrRes] = await Promise.all([
        getEmpresasAPI(cacheBust),
        getUsersAPI(cacheBust)
      ]);
      setEmpresas(empRes.data.empresas || []);
      setUsers(usrRes.data.users || []);
    } catch (error) {
      console.error("Error fetching admin data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // ─── LÓGICA EMPRESAS ───────────────────────────────────────────
  const handleCrearEmpresa = async (e) => {
    e.preventDefault();
    if (!nuevaEmpresa.trim()) return;
    try {
      await createEmpresaAPI({ name: nuevaEmpresa });
      setNuevaEmpresa('');
      fetchData();
      showMsg("Empresa creada.", 'success');
    } catch (err) {
      showMsg("Error: " + (err.response?.data?.detail || err.message));
    }
  };

  const handleUpdateEmpresa = async () => {
    if (!editEmpresa.name.trim()) return;
    try {
      await updateEmpresaAPI(editEmpresa.id, { name: editEmpresa.name });
      setEditEmpresa(null);
      fetchData();
      showMsg("Empresa actualizada.", 'success');
    } catch (err) {
      showMsg("Error: " + (err.response?.data?.detail || err.message));
    }
  };

  const confirmarDeleteEmpresa = async (id) => {
    try {
      await deleteEmpresaAPI(id);
      setDeletingEmpresa(null);
      fetchData();
      showMsg("Empresa eliminada.", 'success');
    } catch (err) {
      setDeletingEmpresa(null);
      showMsg("No se pudo eliminar: " + (err.response?.data?.detail || err.message));
    }
  };

  // ─── LÓGICA USUARIOS ───────────────────────────────────────────
  const handleModuloToggle = (modId, isUserEdit = false) => {
    if (isUserEdit) {
      setEditUser(prev => ({
        ...prev,
        modules: prev.modules.includes(modId)
          ? prev.modules.filter(m => m !== modId)
          : [...prev.modules, modId]
      }));
    } else {
      setNuevoUsuario(prev => ({
        ...prev,
        modules: prev.modules.includes(modId)
          ? prev.modules.filter(m => m !== modId)
          : [...prev.modules, modId]
      }));
    }
  };

  const handleCrearUsuario = async (e) => {
    e.preventDefault();
    if (!nuevoUsuario.username || !nuevoUsuario.password) return;
    try {
      await createUserAPI({ ...nuevoUsuario });
      setNuevoUsuario({ username: '', password: '', role: 'user', empresa_id: '', modules: MODULES_LIST.map(m => m.id) });
      fetchData();
      showMsg("Usuario creado exitosamente.", 'success');
    } catch (err) {
       showMsg("Error creando usuario: " + (err.response?.data?.detail || err.message));
    }
  };

  const handleUpdateUsuario = async () => {
    try {
      await updateUserAPI(editUser.id, {
        username: editUser.username,
        role: editUser.role,
        empresa_id: editUser.empresa_id || null,
        modules: editUser.modules
      });
      setEditUser(null);
      fetchData();
      showMsg("Usuario actualizado.", 'success');
    } catch (err) {
      showMsg("Error actualizando: " + (err.response?.data?.detail || err.message));
    }
  };

  const confirmarDeleteUsuario = async (id) => {
    try {
      await deleteUserAPI(id);
      setDeletingUser(null);
      fetchData();
      showMsg("Usuario eliminado.", 'success');
    } catch (err) {
      setDeletingUser(null);
      showMsg("No se pudo eliminar al usuario: " + (err.response?.data?.detail || err.message));
    }
  };

  const handleUpdatePassword = async () => {
    if (!passUser.password.trim()) return;
    try {
      await updatePasswordAPI(passUser.id, { password: passUser.password });
      setPassUser(null);
      showMsg("Contraseña actualizada exitosamente.", 'success');
    } catch (err) {
      showMsg("Error cambiando clave: " + (err.response?.data?.detail || err.message));
    }
  };

  if (loading) return <div className="p-8 font-medium">Cargando panel de administración...</div>;

  return (
    <div className="space-y-8 relative">
      
      {/* Mensaje global (Toast) */}
      {message && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg text-white font-medium max-w-sm ${message.type === 'error' ? 'bg-red-600' : 'bg-emerald-600'}`}>
           {message.text}
        </div>
      )}

      {/* ─── EMPRESAS ─── */}
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2 mb-4 text-slate-800">
          <Building className="h-6 w-6 text-blue-600" />
          Empresas
        </h2>
        
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-4 max-w-xl">
          <form className="flex gap-2" onSubmit={handleCrearEmpresa}>
            <input 
              type="text" 
              placeholder="Nombre de nueva empresa"
              className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2 px-3 border outline-none"
              value={nuevaEmpresa}
              onChange={e => setNuevaEmpresa(e.target.value)}
            />
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center transition-colors">
              <Plus className="h-4 w-4 mr-1" /> Crear
            </button>
          </form>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50 text-gray-700">
              <tr>
                <th className="px-6 py-3 text-left font-semibold">ID</th>
                <th className="px-6 py-3 text-left font-semibold">Nombre</th>
                <th className="px-6 py-3 text-right font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {empresas.map(emp => (
                <tr key={emp.id} className="hover:bg-gray-50 group">
                  <td className="px-6 py-3 text-gray-500 font-mono text-xs w-24">
                     {emp.id}
                  </td>
                  <td className="px-6 py-3 font-medium text-gray-900">
                    {editEmpresa?.id === emp.id ? (
                      <input 
                        type="text" 
                        className="border rounded px-2 py-1 w-full"
                        value={editEmpresa.name}
                        onChange={e => setEditEmpresa({...editEmpresa, name: e.target.value})}
                      />
                    ) : emp.name}
                  </td>
                  <td className="px-6 py-3 text-right">
                    {editEmpresa?.id === emp.id ? (
                      <div className="flex justify-end gap-2">
                        <button onClick={handleUpdateEmpresa} className="text-emerald-600 hover:text-emerald-700 p-1 bg-emerald-50 rounded"><Check size={16}/></button>
                        <button onClick={() => setEditEmpresa(null)} className="text-gray-500 hover:text-gray-700 p-1 bg-gray-100 rounded"><X size={16}/></button>
                      </div>
                    ) : deletingEmpresa === emp.id ? (
                      <div className="flex justify-end gap-2 items-center">
                        <span className="text-xs text-red-600 font-semibold tracking-tight">¿Borrar?</span>
                        <button onClick={() => confirmarDeleteEmpresa(emp.id)} className="bg-red-500 text-white px-2 py-1 rounded text-xs font-bold hover:bg-red-600">Sí</button>
                        <button onClick={() => setDeletingEmpresa(null)} className="bg-gray-300 text-gray-800 px-2 py-1 rounded text-xs hover:bg-gray-400">No</button>
                      </div>
                    ) : (
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setEditEmpresa(emp)} className="text-blue-600 hover:text-blue-700 p-1"><Edit2 size={16}/></button>
                        <button onClick={() => setDeletingEmpresa(emp.id)} className="text-red-500 hover:text-red-600 p-1"><Trash2 size={16}/></button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {empresas.length === 0 && (
                <tr>
                  <td colSpan="3" className="px-6 py-4 text-center text-gray-500">No hay empresas creadas.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── USUARIOS ─── */}
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2 mb-4 text-slate-800">
          <Users className="h-6 w-6 text-blue-600" />
          Usuarios
        </h2>

        {/* Creador de Usuarios */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-4 w-full">
          <form onSubmit={handleCrearUsuario}>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end mb-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Usuario</label>
                <input type="text" className="w-full rounded-md border py-2 px-3 focus:outline-blue-500 border-gray-300"
                  value={nuevoUsuario.username} onChange={e => setNuevoUsuario({...nuevoUsuario, username: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Contraseña</label>
                <input type="password" className="w-full rounded-md border py-2 px-3 focus:outline-blue-500 border-gray-300"
                  value={nuevoUsuario.password} onChange={e => setNuevoUsuario({...nuevoUsuario, password: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Rol</label>
                <select className="w-full rounded-md border py-2 px-3 focus:outline-blue-500 border-gray-300"
                  value={nuevoUsuario.role} onChange={e => setNuevoUsuario({...nuevoUsuario, role: e.target.value})}>
                  <option value="user">Cajero / Normal</option>
                  <option value="admin">Administrador (Root)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Empresa</label>
                <select className="w-full rounded-md border py-2 px-3 focus:outline-blue-500 border-gray-300 disabled:opacity-50"
                  value={nuevoUsuario.empresa_id} 
                  onChange={e => setNuevoUsuario({...nuevoUsuario, empresa_id: e.target.value})}
                  disabled={nuevoUsuario.role === 'admin'}
                >
                  <option value="">-- Seleccionar --</option>
                  {empresas.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {nuevoUsuario.role === 'user' && (
              <div className="mb-4 p-3 bg-slate-50 border rounded-lg">
                <p className="text-xs font-semibold text-slate-700 mb-2">Permisos (Módulos accesibles):</p>
                <div className="flex flex-wrap gap-3">
                  {MODULES_LIST.map(mod => (
                    <label key={mod.id} className="flex items-center gap-1.5 text-sm cursor-pointer hover:bg-white px-2 py-1 rounded border border-transparent hover:border-slate-200">
                      <input 
                        type="checkbox" 
                        className="rounded text-blue-600 focus:ring-blue-500"
                        checked={nuevoUsuario.modules.includes(mod.id)}
                        onChange={() => handleModuloToggle(mod.id)}
                      />
                      {mod.label}
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-md flex items-center transition-colors font-medium">
                <Plus className="h-4 w-4 mr-1" /> Añadir Usuario
              </button>
            </div>
          </form>
        </div>

        {/* Tabla Usuarios */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50 text-gray-700">
              <tr>
                <th className="px-6 py-3 text-left font-semibold">Usuario</th>
                <th className="px-6 py-3 text-left font-semibold">Rol</th>
                <th className="px-6 py-3 text-left font-semibold">Empresa</th>
                <th className="px-6 py-3 text-left font-semibold">Módulos</th>
                <th className="px-6 py-3 text-right font-semibold">⚙️</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.map(usr => (
                <tr key={usr.id} className="hover:bg-gray-50 group">
                  {editUser?.id === usr.id ? (
                    <td colSpan="5" className="p-4 bg-blue-50/50">
                      <div className="flex flex-col gap-3">
                         <div className="flex gap-3">
                           <input type="text" className="border rounded px-2 py-1 flex-1" value={editUser.username} onChange={e=>setEditUser({...editUser, username: e.target.value})} />
                           <select className="border rounded px-2 py-1 w-32" value={editUser.role} onChange={e=>setEditUser({...editUser, role: e.target.value})}>
                             <option value="user">Normal</option>
                             <option value="admin">Admin</option>
                           </select>
                           <select className="border rounded px-2 py-1 w-48" value={editUser.empresa_id} onChange={e=>setEditUser({...editUser, empresa_id: e.target.value})} disabled={editUser.role==='admin'}>
                             <option value="">-- Sin empresa --</option>
                             {empresas.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                           </select>
                         </div>
                         {editUser.role === 'user' && (
                           <div className="flex flex-wrap gap-2 p-2 bg-white border rounded">
                             <span className="text-xs text-slate-500 w-full mb-1">Permisos:</span>
                             {MODULES_LIST.map(mod => (
                                <label key={mod.id} className="flex items-center gap-1 text-xs cursor-pointer">
                                  <input type="checkbox" checked={(editUser.modules||[]).includes(mod.id)} onChange={()=>handleModuloToggle(mod.id, true)} />
                                  {mod.label}
                                </label>
                             ))}
                           </div>
                         )}
                         <div className="flex justify-end gap-2">
                            <button onClick={handleUpdateUsuario} className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded text-xs font-bold">Guardar Cambios</button>
                            <button onClick={()=>setEditUser(null)} className="bg-gray-400 hover:bg-gray-500 text-white px-3 py-1 rounded text-xs">Cancelar</button>
                         </div>
                      </div>
                    </td>
                  ) : passUser?.id === usr.id ? (
                    <td colSpan="5" className="p-4 bg-amber-50/50">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                          <KeyRound size={16} className="text-amber-600" />
                          <span className="font-semibold text-amber-900">Nueva clave para {usr.username}:</span>
                          <input 
                            type="text" 
                            className="border rounded px-2 py-1 w-48 outline-amber-500 font-mono text-sm" 
                            placeholder="Ej. admin123"
                            value={passUser.password}
                            onChange={e=>setPassUser({...passUser, password: e.target.value})}
                          />
                        </div>
                        <div className="flex gap-2">
                           <button onClick={handleUpdatePassword} className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1 rounded text-xs font-bold shadow-sm">Confirmar Clave</button>
                           <button onClick={()=>setPassUser(null)} className="bg-gray-400 hover:bg-gray-500 text-white px-3 py-1 rounded text-xs">Cancelar</button>
                        </div>
                      </div>
                    </td>
                  ) : deletingUser === usr.id ? (
                    <td colSpan="5" className="p-4 bg-red-50/50">
                      <div className="flex items-center justify-between gap-4">
                         <span className="font-semibold text-red-700">¿Estás seguro que deseas eliminar permanentemente a {usr.username}?</span>
                         <div className="flex gap-2">
                            <button onClick={()=>confirmarDeleteUsuario(usr.id)} className="bg-red-600 hover:bg-red-700 text-white px-4 py-1.5 rounded text-xs font-bold shadow-sm">Confirmar Eliminación</button>
                            <button onClick={()=>setDeletingUser(null)} className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-1.5 rounded text-xs font-bold shadow-sm">Cancelar</button>
                         </div>
                      </div>
                    </td>
                  ) : (
                    <>
                      <td className="px-6 py-3 font-medium text-gray-900 flex items-center gap-2">
                        {usr.role === 'admin' && <Shield size={14} className="text-purple-600" />}
                        {usr.username}
                      </td>
                      <td className="px-6 py-3">
                        <span className={`px-2 py-1 rounded-full text-[10px] uppercase tracking-wider font-bold ${usr.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                          {usr.role}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-gray-600 text-xs truncate max-w-[120px]">
                         {empresas.find(e => e.id === usr.empresa_id)?.name || <span className="text-gray-400 italic">Global</span>}
                      </td>
                      <td className="px-6 py-3 text-xs text-gray-500 max-w-[150px] truncate">
                         {usr.role === 'admin' ? 'Todos' : (usr.modules || []).join(', ')}
                      </td>
                      <td className="px-6 py-3 text-right">
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => setPassUser({id: usr.id, password: ''})} className="text-amber-500 hover:text-amber-600 p-1.5 hover:bg-amber-50 rounded" title="Cambiar Contraseña"><KeyRound size={16}/></button>
                          <button onClick={() => setEditUser({...usr, modules: usr.modules||MODULES_LIST.map(m=>m.id)})} className="text-blue-600 hover:text-blue-700 p-1.5 hover:bg-blue-50 rounded" title="Editar Permisos/Rol"><Edit2 size={16}/></button>
                          <button onClick={() => setDeletingUser(usr.id)} className="text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 rounded" title="Eliminar"><Trash2 size={16}/></button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
