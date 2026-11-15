import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Wallet, ShieldCheck, Trash2 } from 'lucide-react';

const supabaseUrl = 'https://nymwaxuzfyclynucwavr.supabase.co';
const supabaseKey = 'sb_publishable_EPQQAp7s9TRI0Qa0bBMxLQ_62mefp-a';
const supabase = createClient(supabaseUrl, supabaseKey);

const formatCOP = (value) => {
  const num = Number(value) || 0;
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(num);
};

export default function App() {
  const [movimientos, setMovimientos] = useState([]);
  const [activeRole, setActiveRole] = useState('RECAUDADOR');
  const [isRecaudadorAuth, setIsRecaudadorAuth] = useState(false);
  const [recPinInput, setRecPinInput] = useState('');
  const [recPinError, setRecPinError] = useState('');
  
  const [isTesoreroAuth, setIsTesoreroAuth] = useState(false);
  const [tesPinInput, setTesPinInput] = useState('');
  const [tesPinError, setTesPinError] = useState('');

  const pinRecaudador = '2026';
  const pinTesorero = '1234';

  const [descripcion, setDescripcion] = useState('');
  const [monto, setMonto] = useState('');

  // Función para cargar los datos desde Supabase
  const cargarDatosNube = async () => {
    const { data, error } = await supabase
      .from('estado_tesoreria')
      .select('datos')
      .eq('id', 1)
      .single();
    
    if (data && data.datos) {
      setMovimientos(Array.isArray(data.datos) ? data.datos : []);
    }
  };

  useEffect(() => {
    cargarDatosNube();

    // Configurar canal de tiempo real para escuchar cambios al instante
    const channel = supabase
      .channel('public:estado_tesoreria')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'estado_tesoreria', filter: 'id=eq.1' },
        (payload) => {
          if (payload.new && payload.new.datos) {
            setMovimientos(Array.isArray(payload.new.datos) ? payload.new.datos : []);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const guardarNube = async (nuevosMovs) => {
    const { error } = await supabase
      .from('estado_tesoreria')
      .upsert({ id: 1, datos: nuevosMovs });
    
    if (error) {
      console.error('Error al guardar en Supabase:', error);
    }
  };

  const handleRecaudadorLogin = (e) => {
    e.preventDefault();
    if (recPinInput.trim() === pinRecaudador) {
      setIsRecaudadorAuth(true);
      setRecPinError('');
      setRecPinInput('');
    } else {
      setRecPinError('PIN incorrecto.');
    }
  };

  const handleTesoreroLogin = (e) => {
    e.preventDefault();
    if (tesPinInput.trim() === pinTesorero) {
      setIsTesoreroAuth(true);
      setTesPinError('');
      setTesPinInput('');
    } else {
      setTesPinError('PIN incorrecto.');
    }
  };

  const handleRegistrar = (e) => {
    e.preventDefault();
    const valor = Number(monto.toString().replace(/\D/g, ''));
    if (!descripcion.trim() || valor <= 0) return;

    const nuevo = {
      id: `REC-${Math.floor(100 + Math.random() * 900)}`,
      fecha: new Date().toLocaleDateString('es-CO'),
      descripcion: descripcion.trim(),
      monto: valor,
    };

    const actualizados = [nuevo, ...movimientos];
    setMovimientos(actualizados);
    guardarNube(actualizados);
    setDescripcion('');
    setMonto('');
  };

  const handleEliminar = (id) => {
    const actualizados = movimientos.filter((m) => m.id !== id);
    setMovimientos(actualizados);
    guardarNube(actualizados);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-16">
      <header className="bg-indigo-950 text-white shadow-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-800 p-2.5 rounded-xl border border-indigo-700">
              <Wallet className="w-7 h-7 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Tesorería & Recaudos Eclesiásticos</h1>
              <p className="text-xs text-indigo-200">Sincronización en tiempo real activa</p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-indigo-900/90 p-1.5 rounded-xl">
            <button
              onClick={() => setActiveRole('RECAUDADOR')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeRole === 'RECAUDADOR' ? 'bg-white text-indigo-950 shadow-sm' : 'text-indigo-200 hover:text-white'
              }`}
            >
              Módulo Recaudadores
            </button>
            <button
              onClick={() => setActiveRole('TESORERO')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeRole === 'TESORERO' ? 'bg-emerald-500 text-indigo-950 shadow-sm' : 'text-indigo-200 hover:text-white'
              }`}
            >
              Tesorería Central
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 pt-8">
        {activeRole === 'RECAUDADOR' && (
          <>
            {!isRecaudadorAuth ? (
              <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl border p-8 text-center">
                <h2 className="text-xl font-bold text-slate-900 mb-2">Acceso Recaudadores</h2>
                <p className="text-xs text-slate-500 mb-6">Ingrese PIN de Recaudador (2026)</p>
                <form onSubmit={handleRecaudadorLogin} className="space-y-4">
                  <input
                    type="password"
                    maxLength={12}
                    placeholder="••••"
                    value={recPinInput}
                    onChange={(e) => setRecPinInput(e.target.value)}
                    className="w-full text-center text-2xl tracking-[0.5em] font-bold py-3 px-4 rounded-xl border outline-none"
                    autoFocus
                  />
                  {recPinError && <p className="text-xs text-rose-600 font-semibold">{recPinError}</p>}
                  <button type="submit" className="w-full py-3 rounded-xl bg-indigo-950 text-white font-bold text-sm shadow-md">
                    Ingresar
                  </button>
                </form>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-2xl border shadow-sm">
                  <h3 className="text-base font-bold mb-4">Registrar Recaudo</h3>
                  <form onSubmit={handleRegistrar} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Descripción</label>
                      <input
                        type="text"
                        required
                        placeholder="Ej. Ofrenda dominical..."
                        value={descripcion}
                        onChange={(e) => setDescripcion(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Monto ($)</label>
                      <input
                        type="number"
                        required
                        placeholder="Ej. 50000"
                        value={monto}
                        onChange={(e) => setMonto(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border text-sm font-bold"
                      />
                    </div>
                    <button type="submit" className="w-full py-3 bg-emerald-600 text-white font-bold text-sm rounded-xl shadow-md">
                      Guardar y Sincronizar Recaudo
                    </button>
                  </form>
                </div>

                <div className="bg-white p-6 rounded-2xl border shadow-sm">
                  <h3 className="text-base font-bold mb-4">Lista de Recaudos (En Vivo)</h3>
                  <div className="space-y-3">
                    {movimientos.length === 0 ? (
                      <p className="text-sm text-slate-500 text-center py-6">No hay registros guardados en la nube.</p>
                    ) : (
                      movimientos.map((m) => (
                        <div key={m.id} className="p-4 rounded-xl border bg-slate-50 flex justify-between items-center">
                          <div>
                            <span className="text-xs font-mono font-bold text-indigo-800">{m.id}</span>
                            <h4 className="font-bold text-sm text-slate-900">{m.descripcion}</h4>
                            <span className="text-xs text-slate-500">{m.fecha}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-extrabold text-base text-emerald-700">{formatCOP(m.monto)}</span>
                            <button
                              onClick={() => handleEliminar(m.id)}
                              className="block mt-1 text-rose-600 text-xs font-semibold hover:underline"
                            >
                              Eliminar
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {activeRole === 'TESORERO' && (
          <>
            {!isTesoreroAuth ? (
              <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl border p-8 text-center">
                <h2 className="text-xl font-bold text-slate-900 mb-2">Acceso Tesorería Central</h2>
                <p className="text-xs text-slate-500 mb-6">Ingrese PIN de Tesorero (1234)</p>
                <form onSubmit={handleTesoreroLogin} className="space-y-4">
                  <input
                    type="password"
                    maxLength={12}
                    placeholder="••••"
                    value={tesPinInput}
                    onChange={(e) => setTesPinInput(e.target.value)}
                    className="w-full text-center text-2xl tracking-[0.5em] font-bold py-3 px-4 rounded-xl border outline-none"
                    autoFocus
                  />
                  {tesPinError && <p className="text-xs text-rose-600 font-semibold">{tesPinError}</p>}
                  <button type="submit" className="w-full py-3 rounded-xl bg-indigo-950 text-white font-bold text-sm shadow-md">
                    Ingresar
                  </button>
                </form>
              </div>
            ) : (
              <div className="bg-white p-6 rounded-2xl border shadow-sm text-center py-12">
                <ShieldCheck className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
                <h3 className="text-lg font-bold">Módulo de Tesorería Activo</h3>
                <p className="text-sm text-slate-500 mt-1">Total acumulado en la nube:</p>
                <p className="text-3xl font-extrabold text-emerald-600 mt-2">
                  {formatCOP(movimientos.reduce((a, b) => a + Number(b.monto), 0))}
                </p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}