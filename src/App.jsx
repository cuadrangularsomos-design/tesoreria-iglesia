import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://nymwaxuzfyclynucwavr.supabase.co'
const supabaseKey = 'sb_publishable_EPQQAp7s9TRI0Qa0bBMxLQ_62mefp-a'
const supabase = createClient(supabaseUrl, supabaseKey)

import React, { useState, useEffect, useMemo } from 'react';
import {
  Wallet,
  HandCoins,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  Clock,
  AlertTriangle,
  CheckCircle2,
  PlusCircle,
  Lock,
  Unlock,
  Download,
  Search,
  Calculator,
  ArrowUpRight,
  ArrowDownRight,
  X,
  FileSpreadsheet,
  Info,
  Banknote,
  Edit3,
  Package,
  Users,
  UserPlus,
  Trash2,
  ShoppingBag,
  UserCheck,
  UserX,
  ShieldAlert,
  KeyRound,
  HelpCircle,
  Settings,
  Calendar
} from 'lucide-react';

const formatCOP = (value) => {
  const num = Number(value) || 0;
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(num);
};

const calcularResumenInventario = (item) => {
  if (!item || item.modoRegistro !== 'UNIDADES') {
    return {
      esUnidades: false,
      producidas: 0,
      precioUnitario: 0,
      totalEsperado: Number(item?.montoReportado) || 0,
      unidadesPagadas: 0,
      plataPagada: Number(item?.montoReportado) || 0,
      unidadesFiadas: 0,
      plataFiada: 0,
      unidadesIncobrables: 0,
      plataIncobrable: 0,
      unidadesSinVender: 0,
      plataSinVender: 0,
      totalUnidadesFaltantes: 0,
      totalPlataFaltante: 0,
    };
  }

  const producidas = Number(item.cantidadProducida) || 0;
  const precioUnitario = Number(item.precioUnitario) || 0;
  const totalEsperado = producidas * precioUnitario;
  const compradores = Array.isArray(item.compradores) ? item.compradores : [];

  let unidadesPagadas = 0;
  let unidadesFiadas = 0;
  let unidadesIncobrables = 0;
  let plataPagada = 0;
  let plataFiada = 0;
  let plataIncobrable = 0;

  compradores.forEach((c) => {
    if (!c) return;
    const cant = Number(c.cantidad) || 0;
    const totalComp = cant * precioUnitario;

    if (c.estadoPago === 'INCOBRABLE') {
      unidadesIncobrables += cant;
      plataIncobrable += totalComp;
      return;
    }

    const abonado =
      c.estadoPago === 'PAGADO'
        ? totalComp
        : Math.min(totalComp, Math.max(0, Number(c.montoAbonado) || 0));
    const saldoPendiente = Math.max(0, totalComp - abonado);

    plataPagada += abonado;
    plataFiada += saldoPendiente;

    if (saldoPendiente === 0) {
      unidadesPagadas += cant;
    } else {
      unidadesFiadas += cant;
    }
  });

  const unidadesSinVender = Math.max(0, producidas - (unidadesPagadas + unidadesFiadas + unidadesIncobrables));
  const plataSinVender = unidadesSinVender * precioUnitario;
  const totalUnidadesFaltantes = unidadesFiadas + unidadesSinVender;
  const totalPlataFaltante = plataFiada + plataSinVender;

  return {
    esUnidades: true,
    producidas,
    precioUnitario,
    totalEsperado,
    unidadesPagadas,
    plataPagada,
    unidadesFiadas,
    plataFiada,
    unidadesIncobrables,
    plataIncobrable,
    unidadesSinVender,
    plataSinVender,
    totalUnidadesFaltantes,
    totalPlataFaltante,
  };
};

const CATEGORIAS_EGRESO = [
  'Insumos Cocina',
  'Servicios Públicos',
  'Mantenimiento Templo',
  'Ayuda Social',
  'Sonido / Multimedia',
  'Papelería / Aseo',
  'Otro',
];

export default function App() {
  const [movimientos, setMovimientos] = useState([]);
  const [cierresMensuales, setCierresMensuales] = useState([]);
  const [configuracionApp, setConfiguracionApp] = useState({
    titulo: 'Tesorería & Recaudos Eclesiásticos',
    subtitulo: 'Control Estricto de Recaudos, Abonos y Cierres en Tiempo Real • Supabase',
    logoUrl: ''
  });
  
  const [usuariosSistema, setUsuariosSistema] = useState([
    { id: 'US-0', nombre: 'Administrador / Pastor', usuario: 'admin', clave: 'admin2026', rol: 'ADMINISTRADOR', activo: true, solictudClave: false, claveAutorizada: false },
    { id: 'US-1', nombre: 'Tesorero Principal', usuario: 'tesorero', clave: '1234', rol: 'TESORERO', activo: true, solictudClave: false, claveAutorizada: false },
    { id: 'US-2', nombre: 'Hna. Marta Gómez', usuario: 'marta', clave: '2026', rol: 'RECAUDADOR', activo: true, solictudClave: false, claveAutorizada: false },
    { id: 'US-3', nombre: 'Hno. Carlos Ruiz', usuario: 'carlos', clave: '2026', rol: 'RECAUDADOR', activo: true, solictudClave: false, claveAutorizada: false }
  ]);

  const [cargandoNube, setCargandoNube] = useState(true);

  useEffect(() => {
    supabase
      .from('estado_tesoreria')
      .select('datos, usuarios, config, cierres')
      .eq('id', 1)
      .single()
      .then(({ data }) => {
        if (data) {
          if (data.datos) setMovimientos(Array.isArray(data.datos) ? data.datos : []);
          if (data.usuarios && Array.isArray(data.usuarios)) setUsuariosSistema(data.usuarios);
          if (data.config) setConfiguracionApp((prev) => ({ ...prev, ...data.config }));
          if (data.cierres) setCierresMensuales(Array.isArray(data.cierres) ? data.cierres : []);
        }
        setCargandoNube(false);
      })
      .catch((err) => {
        console.error('Error cargando desde Supabase:', err);
        setCargandoNube(false);
      });

    const canalRealtime = supabase
      .channel('cambios_tesoreria')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'estado_tesoreria', filter: 'id=eq.1' },
        (payload) => {
          if (payload && payload.new) {
            if (payload.new.datos) {
              setMovimientos(Array.isArray(payload.new.datos) ? payload.new.datos : []);
            }
            if (payload.new.usuarios && Array.isArray(payload.new.usuarios)) {
              setUsuariosSistema(payload.new.usuarios);
            }
            if (payload.new.config) {
              setConfiguracionApp(payload.new.config);
            }
            if (payload.new.cierres) {
              setCierresMensuales(Array.isArray(payload.new.cierres) ? payload.new.cierres : []);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canalRealtime);
    };
  }, []);

  const guardarEnNube = (nuevosMovs, nuevosUsuarios, nuevaConfig, nuevosCierres) => {
    if (cargandoNube) return;
    try {
      supabase
        .from('estado_tesoreria')
        .upsert({ 
          id: 1, 
          datos: nuevosMovs || movimientos, 
          usuarios: nuevosUsuarios || usuariosSistema,
          config: nuevaConfig || configuracionApp,
          cierres: nuevosCierres || cierresMensuales
        })
        .then(({ error }) => {
          if (error) console.error('Error al guardar en Supabase:', error);
        });
    } catch (err) {
      console.error(err);
    }
  };

  const esMesCerrado = (fechaStr) => {
    if (!fechaStr) return false;
    const mesKey = fechaStr.substring(0, 7);
    return (cierresMensuales || []).some(c => c && c.mes === mesKey);
  };

  const [activeRole, setActiveRole] = useState('RECAUDADOR'); 
  const [adminTab, setAdminTab] = useState('AUDITORIA');
  const [mesCierreInput, setMesCierreInput] = useState(() => new Date().toISOString().substring(0, 7));
  
  const [usuarioLogueadoRecaudador, setUsuarioLogueadoRecaudador] = useState(null);
  const [recUserLoginInput, setRecUserLoginInput] = useState('');
  const [recPassLoginInput, setRecPassLoginInput] = useState('');
  const [recLoginError, setRecLoginError] = useState('');
  const [showCambioClaveRecaudadorModal, setShowCambioClaveRecaudadorModal] = useState(false);
  const [claveActualRecInput, setClaveActualRecInput] = useState('');
  const [claveNuevaRecInput, setClaveNuevaRecInput] = useState('');

  const [usuarioLogueadoTesorero, setUsuarioLogueadoTesorero] = useState(null);
  const [tesUserLoginInput, setTesUserLoginInput] = useState('');
  const [tesPassLoginInput, setTesPassLoginInput] = useState('');
  const [tesLoginError, setTesLoginError] = useState('');
  const [showCambioClaveTesoreroModal, setShowCambioClaveTesoreroModal] = useState(false);
  const [claveActualTesInput, setClaveActualTesInput] = useState('');
  const [claveNuevaTesInput, setClaveNuevaTesInput] = useState('');

  const [usuarioLogueadoAdmin, setUsuarioLogueadoAdmin] = useState(null);
  const [adminUserLoginInput, setAdminUserLoginInput] = useState('');
  const [adminPassLoginInput, setAdminPassLoginInput] = useState('');
  const [adminLoginError, setAdminLoginError] = useState('');

  const [showOlvidoClaveModal, setShowOlvidoClaveModal] = useState(false);
  const [usuarioOlvidoInput, setUsuarioOlvidoInput] = useState('');

  const [showRestablecerClaveModal, setShowRestablecerClaveModal] = useState(false);
  const [usuarioRestablecerAlias, setUsuarioRestablecerAlias] = useState('');
  const [nuevaClaveInput, setNuevaClaveInput] = useState('');

  const [eliminarUsuarioModal, setEliminarUsuarioModal] = useState(null);

  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4500);
  };

  const [nuevoUserNombre, setNuevoUserNombre] = useState('');
  const [nuevoUserAlias, setNuevoUserAlias] = useState('');
  const [nuevoUserClave, setNuevoUserClave] = useState('');
  const [nuevoUserRol, setNuevoUserRol] = useState('RECAUDADOR');

  const [modoRecaudo, setModoRecaudo] = useState('UNIDADES');
  const [recFecha, setRecFecha] = useState(() => new Date().toISOString().split('T')[0]);
  const [recActividadLibre, setRecActividadLibre] = useState('');
  const [recDescripcion, setRecDescripcion] = useState('');
  const [recMonto, setRecMonto] = useState('');
  const [recMetodo, setRecMetodo] = useState('Efectivo');

  const [recCantidadProducida, setRecCantidadProducida] = useState('30');
  const [recPrecioUnitario, setRecPrecioUnitario] = useState('12000');
  const [recCompradores, setRecCompradores] = useState([]);
  const [nuevoCompNombre, setNuevoCompNombre] = useState('');
  const [nuevoCompCantidad, setNuevoCompCantidad] = useState('1');
  const [nuevoCompEstado, setNuevoCompEstado] = useState('PAGADO');
  const [nuevoCompAbono, setNuevoCompAbono] = useState('');

  const [abonoModal, setAbonoModal] = useState(null);
  const [valorAbonoInput, setValorAbonoInput] = useState('');
  const [editingRecaudoId, setEditingRecaudoId] = useState(null);
  const [solicitudEdicionModal, setSolicitudEdicionModal] = useState(null);
  const [motivoSolicitudEdicion, setMotivoSolicitudEdicion] = useState('');
  const [expandedRows, setExpandedRows] = useState({});

  const [solicitudIncobrableModal, setSolicitudIncobrableModal] = useState(null);
  const [motivoIncobrableInput, setMotivoIncobrableInput] = useState('');

  const [eliminarItemModal, setEliminarItemModal] = useState(null);
  const [solicitudBorradoModal, setSolicitudBorradoModal] = useState(null);
  const [motivoBorradoInput, setMotivoBorradoInput] = useState('');

  const [tesoreroTab, setTesoreroTab] = useState('BANDEJA');
  const [arqueoItem, setArqueoItem] = useState(null);
  const [montoFisicoContado, setMontoFisicoContado] = useState('');
  const [notaArqueo, setNotaArqueo] = useState('');

  const [egrFecha, setEgrFecha] = useState(() => new Date().toISOString().split('T')[0]);
  const [egrCategoria, setEgrCategoria] = useState('Insumos Cocina');
  const [egrConcepto, setEgrConcepto] = useState('');
  const [egrResponsable, setEgrResponsable] = useState('');
  const [egrMonto, setEgrMonto] = useState('');
  const [egrNota, setEgrNota] = useState('');
  const [egrSobranteDevuelto, setEgrSobranteDevuelto] = useState('');

  const [filtroLibro, setFiltroLibro] = useState('TODOS');
  const [busquedaLibro, setBusquedaLibro] = useState('');

  const toggleExpandRow = (id) => {
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleEnviarSolicitudBorrado = (e) => {
    e.preventDefault();
    if (!solicitudBorradoModal) return;
    if (esMesCerrado(solicitudBorradoModal.fecha)) {
      showToast('Este registro pertenece a un mes cerrado oficialmente por el Pastor. No se puede modificar.', 'error');
      return;
    }
    const motivo = motivoBorradoInput.trim();
    if (!motivo) {
      showToast('Escribe el motivo del borrado.', 'error');
      return;
    }

    const actualizados = (movimientos || []).map((m) => {
      if (m && m.id === solicitudBorradoModal.id) {
        return {
          ...m,
          solicitudBorrado: true,
          motivoBorrado: motivo,
          solicitanteBorrado: usuarioLogueadoTesorero ? usuarioLogueadoTesorero.nombre : 'Tesorería'
        };
      }
      return m;
    });

    setMovimientos(actualizados);
    guardarEnNube(actualizados, usuariosSistema, configuracionApp, cierresMensuales);
    setSolicitudBorradoModal(null);
    setMotivoBorradoInput('');
    showToast('Solicitud de borrado enviada al Pastor / Administrador.');
  };

  const handleResolverBorradoAdmin = (item, autorizar) => {
    if (!item) return;
    const actualizados = (movimientos || []).map((m) => {
      if (m && m.id === item.id) {
        if (autorizar) {
          return {
            ...m,
            solicitudBorrado: false,
            borradoAutorizado: true,
            notaTesorero: `${m.notaTesorero || ''} [Pastor autorizó el borrado]`
          };
        } else {
          return {
            ...m,
            solicitudBorrado: false,
            borradoAutorizado: false,
            motivoBorrado: '',
            notaTesorero: `${m.notaTesorero || ''} [Pastor denegó el borrado]`
          };
        }
      }
      return m;
    });
    setMovimientos(actualizados);
    guardarEnNube(actualizados, usuariosSistema, configuracionApp, cierresMensuales);
    showToast(autorizar ? 'Borrado autorizado. Ya se puede eliminar del libro.' : 'Solicitud de borrado denegada.');
  };

  const handleEliminarRegistroLibro = () => {
    if (!eliminarItemModal) return;
    if (esMesCerrado(eliminarItemModal.fecha)) {
      showToast('Este registro pertenece a un mes cerrado oficialmente por el Pastor.', 'error');
      setEliminarItemModal(null);
      return;
    }
    const actualizados = (movimientos || []).filter((m) => m && m.id !== eliminarItemModal.id);
    setMovimientos(actualizados);
    guardarEnNube(actualizados, usuariosSistema, configuracionApp, cierresMensuales);
    setEliminarItemModal(null);
    showToast('Registro eliminado del libro correctamente.', 'warning');
  };

  const handleCrearUsuarioSistema = (e) => {
    e.preventDefault();
    if (!nuevoUserNombre.trim() || !nuevoUserAlias.trim() || !nuevoUserClave.trim()) {
      showToast('Completa todos los campos para el nuevo usuario.', 'error');
      return;
    }

    const aliasLimpio = nuevoUserAlias.trim().toLowerCase();
    const existe = (usuariosSistema || []).some((u) => u && u.usuario && u.usuario.toLowerCase() === aliasLimpio);
    if (existe) {
      showToast('Ese nombre de usuario ya está registrado. Usa otro.', 'error');
      return;
    }

    const nuevoUser = {
      id: `USR-${Date.now()}`,
      nombre: nuevoUserNombre.trim(),
      usuario: aliasLimpio,
      clave: nuevoUserClave.trim(),
      rol: nuevoUserRol,
      activo: true,
      solicitudClave: false,
      claveAutorizada: false
    };

    const actualizados = [...(usuariosSistema || []), nuevoUser];
    setUsuariosSistema(actualizados);
    guardarEnNube(movimientos, actualizados, configuracionApp, cierresMensuales);
    setNuevoUserNombre('');
    setNuevoUserAlias('');
    setNuevoUserClave('');
    showToast(`Usuario ${nuevoUser.nombre} creado con éxito.`);
  };

  const handleToggleEstadoUsuario = (userId) => {
    const actualizados = (usuariosSistema || []).map((u) => {
      if (u && u.id === userId) {
        return { ...u, activo: !u.activo };
      }
      return u;
    });
    setUsuariosSistema(actualizados);
    guardarEnNube(movimientos, actualizados, configuracionApp, cierresMensuales);
    showToast('Estado del usuario actualizado.');
  };

  const handleConfirmarEliminarUsuario = () => {
    if (!eliminarUsuarioModal) return;
    const admins = (usuariosSistema || []).filter(u => u && u.rol === 'ADMINISTRADOR');
    if (eliminarUsuarioModal.rol === 'ADMINISTRADOR' && admins.length <= 1) {
      showToast('No puedes eliminar al único administrador del sistema.', 'error');
      setEliminarUsuarioModal(null);
      return;
    }

    const actualizados = (usuariosSistema || []).filter(u => u && u.id !== eliminarUsuarioModal.id);
    setUsuariosSistema(actualizados);
    guardarEnNube(movimientos, actualizados, configuracionApp, cierresMensuales);
    setEliminarUsuarioModal(null);
    showToast('Usuario eliminado del sistema correctamente.', 'warning');
  };

  const handleEjecutarCierreDeMes = (e) => {
    e.preventDefault();
    const movsDelMes = (movimientos || []).filter(m => m && m.fecha && m.fecha.startsWith(mesCierreInput));
    
    let entradasMes = 0;
    let salidasMes = 0;
    movsDelMes.forEach(m => {
      if (m.tipo === 'INGRESO') {
        entradasMes += Number(m.montoRecibido) || Number(m.montoReportado) || 0;
      } else if (m.tipo === 'EGRESO') {
        salidasMes += Math.max(0, (Number(m.montoSalida) || 0) - (Number(m.montoSobranteDevuelto) || 0));
      }
    });

    const nuevoCierre = {
      id: 'CIERRE-' + mesCierreInput,
      mes: mesCierreInput,
      fechaCierre: new Date().toISOString().split('T')[0],
      responsableCierre: usuarioLogueadoAdmin ? usuarioLogueadoAdmin.nombre : 'Pastor / Administrador',
      totalEntradas: entradasMes,
      totalSalidas: salidasMes,
      balanceNeto: entradasMes - salidasMes,
      cantidadMovimientos: movsDelMes.length,
      saldoCajaFinal: kpis.saldoRealEnCaja
    };

    const sinDuplicados = (cierresMensuales || []).filter(c => c && c.mes !== mesCierreInput);
    const actualizadosCierres = [nuevoCierre, ...sinDuplicados];
    
    setCierresMensuales(actualizadosCierres);
    guardarEnNube(movimientos, usuariosSistema, configuracionApp, actualizadosCierres);
    showToast(`¡Cierre oficial del mes ${mesCierreInput} ejecutado y sellado por el Pastor con éxito!`);
  };

  const handleReabrirMesPastor = (mesKey) => {
    const actualizadosCierres = (cierresMensuales || []).filter(c => c && c.mes !== mesKey);
    setCierresMensuales(actualizadosCierres);
    guardarEnNube(movimientos, usuariosSistema, configuracionApp, actualizadosCierres);
    showToast(`El mes ${mesKey} ha sido reabierto por el Pastor. Ya se permiten modificaciones.`, 'warning');
  };

  const handleCambiarClavePropiaRecaudador = (e) => {
    e.preventDefault();
    if (!usuarioLogueadoRecaudador) return;

    if (claveActualRecInput.trim() !== usuarioLogueadoRecaudador.clave) {
      showToast('La clave actual es incorrecta.', 'error');
      return;
    }
    if (!claveNuevaRecInput.trim()) {
      showToast('Ingresa la nueva contraseña.', 'error');
      return;
    }

    const actualizados = (usuariosSistema || []).map((u) => {
      if (u && u.id === usuarioLogueadoRecaudador.id) {
        return { ...u, clave: claveNuevaRecInput.trim() };
      }
      return u;
    });

    setUsuariosSistema(actualizados);
    guardarEnNube(movimientos, actualizados, configuracionApp, cierresMensuales);
    setUsuarioLogueadoRecaudador({ ...usuarioLogueadoRecaudador, clave: claveNuevaRecInput.trim() });
    setShowCambioClaveRecaudadorModal(false);
    setClaveActualRecInput('');
    setClaveNuevaRecInput('');
    showToast('¡Tu contraseña ha sido actualizada con éxito!');
  };

  const handleCambiarClavePropiaTesorero = (e) => {
    e.preventDefault();
    if (!usuarioLogueadoTesorero) return;

    if (claveActualTesInput.trim() !== usuarioLogueadoTesorero.clave) {
      showToast('La clave actual es incorrecta.', 'error');
      return;
    }
    if (!claveNuevaTesInput.trim()) {
      showToast('Ingresa la nueva contraseña.', 'error');
      return;
    }

    const actualizados = (usuariosSistema || []).map((u) => {
      if (u && u.id === usuarioLogueadoTesorero.id) {
        return { ...u, clave: claveNuevaTesInput.trim() };
      }
      return u;
    });

    setUsuariosSistema(actualizados);
    guardarEnNube(movimientos, actualizados, configuracionApp, cierresMensuales);
    setUsuarioLogueadoTesorero({ ...usuarioLogueadoTesorero, clave: claveNuevaTesInput.trim() });
    setShowCambioClaveTesoreroModal(false);
    setClaveActualTesInput('');
    setClaveNuevaTesInput('');
    showToast('¡Tu contraseña de Tesorero ha sido actualizada con éxito!');
  };

  const handleEnviarSolicitudClave = (e) => {
    e.preventDefault();
    const alias = usuarioOlvidoInput.trim().toLowerCase();
    const usuarioEncontrado = (usuariosSistema || []).find((u) => u && u.usuario && u.usuario.toLowerCase() === alias);

    if (!usuarioEncontrado) {
      showToast('No se encontró ningún usuario con ese nombre en el sistema.', 'error');
      return;
    }

    const actualizados = (usuariosSistema || []).map((u) => {
      if (u && u.usuario && u.usuario.toLowerCase() === alias) {
        return { ...u, solicitudClave: true };
      }
      return u;
    });

    setUsuariosSistema(actualizados);
    guardarEnNube(movimientos, actualizados, configuracionApp, cierresMensuales);
    setShowOlvidoClaveModal(false);
    setUsuarioOlvidoInput('');
    showToast('Solicitud enviada al Administrador con éxito.', 'success');
  };

  const handleAutorizarCambioClave = (userId, autorizar) => {
    const actualizados = (usuariosSistema || []).map((u) => {
      if (u && u.id === userId) {
        return {
          ...u,
          claveAutorizada: autorizar,
          solicitudClave: false
        };
      }
      return u;
    });
    setUsuariosSistema(actualizados);
    guardarEnNube(movimientos, actualizados, configuracionApp, cierresMensuales);
    showToast(autorizar ? 'Cambio de clave autorizado para el usuario.' : 'Solicitud rechazada.');
  };

  const handleConfirmarNuevoCambioClave = (e) => {
    e.preventDefault();
    const alias = usuarioRestablecerAlias.trim().toLowerCase();
    const nuevaClave = nuevaClaveInput.trim();

    const usr = (usuariosSistema || []).find((u) => u && u.usuario && u.usuario.toLowerCase() === alias);
    if (!usr) {
      showToast('Usuario no encontrado.', 'error');
      return;
    }

    if (!usr.claveAutorizada) {
      showToast('Tu solicitud aún no ha sido autorizada por el Administrador.', 'warning');
      return;
    }

    const actualizados = (usuariosSistema || []).map((u) => {
      if (u && u.usuario && u.usuario.toLowerCase() === alias) {
        return {
          ...u,
          clave: nuevaClave,
          claveAutorizada: false,
          solicitudClave: false
        };
      }
      return u;
    });

    setUsuariosSistema(actualizados);
    guardarEnNube(movimientos, actualizados, configuracionApp, cierresMensuales);
    setShowRestablecerClaveModal(false);
    setUsuarioRestablecerAlias('');
    setNuevaClaveInput('');
    showToast('¡Contraseña actualizada con éxito! Ya puedes iniciar sesión.');
  };

  const resumenFormUnidades = useMemo(() => {
    const producidas = Number(recCantidadProducida) || 0;
    const precio = Number(recPrecioUnitario) || 0;
    const totalEsperado = producidas * precio;

    let unidadesPagadas = 0;
    let unidadesFiadas = 0;
    let unidadesIncobrables = 0;
    let plataRecaudada = 0;
    let plataFiada = 0;
    let plataIncobrable = 0;

    (recCompradores || []).forEach((c) => {
      if (!c) return;
      const q = Number(c.cantidad) || 0;
      const totalComp = q * precio;

      if (c.estadoPago === 'INCOBRABLE') {
        unidadesIncobrables += q;
        plataIncobrable += totalComp;
        return;
      }

      const abonado =
        c.estadoPago === 'PAGADO'
          ? totalComp
          : Math.min(totalComp, Math.max(0, Number(c.montoAbonado) || 0));
      const saldo = Math.max(0, totalComp - abonado);

      plataRecaudada += abonado;
      plataFiada += saldo;
      if (saldo === 0) unidadesPagadas += q;
      else unidadesFiadas += q;
    });

    const unidadesAsignadas = unidadesPagadas + unidadesFiadas + unidadesIncobrables;
    const unidadesSinVender = Math.max(0, producidas - unidadesAsignadas);
    const plataSinVender = unidadesSinVender * precio;
    const totalUnidadesFaltantes = unidadesFiadas + unidadesSinVender;
    const totalPlataFaltante = plataFiada + plataSinVender;

    return {
      producidas,
      precio,
      totalEsperado,
      unidadesPagadas,
      plataPagada,
      unidadesFiadas,
      plataFiada,
      unidadesIncobrables,
      plataIncobrable,
      unidadesSinVender,
      plataSinVender,
      totalUnidadesFaltantes,
      totalPlataFaltante,
    };
  }, [recCantidadProducida, recPrecioUnitario, recCompradores]);

  const handleAgregarCompradorForm = () => {
    const nombre = (nuevoCompNombre || '').trim();
    const cant = Number(nuevoCompCantidad) || 0;
    const producidas = Number(recCantidadProducida) || 0;
    const precio = Number(recPrecioUnitario) || 0;
    const totalComp = cant * precio;

    if (!nombre) {
      showToast('Escribe el nombre de la persona.', 'error');
      return;
    }
    if (cant <= 0) {
      showToast('Cantidad inválida.', 'error');
      return;
    }
    if (producidas > 0 && resumenFormUnidades.unidadesAsignadas + cant > producidas) {
      showToast(`Supera las unidades producidas (${resumenFormUnidades.unidadesSinVender} restantes).`, 'error');
      return;
    }

    let montoAbonadoInicial = totalComp;
    let estadoFinal = nuevoCompEstado;
    if (nuevoCompEstado === 'FIADO') {
      const abonoNum = Math.max(0, Number(nuevoCompAbono) || 0);
      if (abonoNum >= totalComp) {
        montoAbonadoInicial = totalComp;
        estadoFinal = 'PAGADO';
      } else {
        montoAbonadoInicial = abonoNum;
      }
    } else if (nuevoCompEstado === 'INCOBRABLE') {
      montoAbonadoInicial = 0;
    }

    const nuevo = {
      id: `COMP-${Date.now()}-${Math.floor(Math.random() * 100)}`,
      nombre,
      cantidad: cant,
      estadoPago: estadoFinal,
      montoAbonado: montoAbonadoInicial,
    };

    setRecCompradores([...(recCompradores || []), nuevo]);
    setNuevoCompNombre('');
    setNuevoCompCantidad('1');
    setNuevoCompAbono('');
  };

  const handleEnviarSolicitudIncobrable = (e) => {
    e.preventDefault();
    if (!solicitudIncobrableModal) return;
    if (esMesCerrado(solicitudIncobrableModal.fecha)) {
      showToast('Este registro pertenece a un mes cerrado oficialmente por el Pastor. No se puede modificar.', 'error');
      return;
    }
    const motivo = (motivoIncobrableInput || '').trim();
    if (!motivo) {
      showToast('Escribe el motivo por el cual la deuda es incobrable.', 'error');
      return;
    }

    const { movimientoId, compradorId } = solicitudIncobrableModal;
    let nombreDeudorLocal = '';

    const actualizados = (movimientos || []).map((m) => {
      if (!m || m.id !== movimientoId || m.modoRegistro !== 'UNIDADES') return m;
      const comps = (Array.isArray(m.compradores) ? m.compradores : []).map((c) => {
        if (!c || c.id !== compradorId) return c;
        nombreDeudorLocal = c.nombre;
        return {
          ...c,
          solicitudIncobrable: true,
          motivoIncobrable: motivo
        };
      });

      return {
        ...m,
        compradores: comps,
        notaTesorero: `${m.notaTesorero || ''} [Solicitud de baja/incobrable enviada para ${nombreDeudorLocal || 'deudor'}]`
      };
    });

    setMovimientos(actualizados);
    guardarEnNube(actualizados, usuariosSistema, configuracionApp, cierresMensuales);
    setSolicitudIncobrableModal(null);
    setMotivoIncobrableInput('');
    showToast('Solicitud de "Incobrable" enviada a Tesorería con éxito.');
  };

  const handleTesoreroResolverIncobrable = (movimientoId, compradorId, aprobar) => {
    const movTarget = (movimientos || []).find(m => m && m.id === movimientoId);
    if (movTarget && esMesCerrado(movTarget.fecha)) {
      showToast('Este registro pertenece a un mes cerrado oficialmente por el Pastor. No se puede modificar.', 'error');
      return;
    }
    const nombreTesoreroActual = usuarioLogueadoTesorero ? usuarioLogueadoTesorero.nombre : 'Tesorero';

    const actualizados = (movimientos || []).map((m) => {
      if (!m || m.id !== movimientoId || m.modoRegistro !== 'UNIDADES') return m;
      let nombreComp = '';
      const comps = (Array.isArray(m.compradores) ? m.compradores : []).map((c) => {
        if (!c || c.id !== compradorId) return c;
        nombreComp = c.nombre;
        return {
          ...c,
          estadoPago: aprobar ? 'INCOBRABLE' : c.estadoPago,
          solicitudIncobrable: false,
          motivoIncobrable: ''
        };
      });

      return {
        ...m,
        compradores: comps,
        notaTesorero: `${m.notaTesorero || '—'} [${aprobar ? `Deuda de ${nombreComp} dada de baja como INCOBRABLE por ${nombreTesoreroActual}` : `Solicitud de incobrable rechazada para ${nombreComp}`}]`
      };
    });

    setMovimientos(actualizados);
    guardarEnNube(actualizados, usuariosSistema, configuracionApp, cierresMensuales);
    showToast(aprobar ? 'Deuda aprobada como Incobrable / Condonada.' : 'Solicitud rechazada.');
  };

  const handleModificarCompradorExistenteEnForm = (compId, campo, valor) => {
    setRecCompradores((prev) =>
      (prev || []).map((c) => {
        if (!c || c.id !== compId) return c;
        const actualizado = { ...c, [campo]: valor };
        if (campo === 'cantidad') {
          const cantNum = Number(valor) || 0;
          const precio = Number(recPrecioUnitario) || 0;
          const totalC = cantNum * precio;
          if (actualizado.estadoPago === 'PAGADO') {
            actualizado.montoAbonado = totalC;
          }
        }
        return actualizado;
      })
    );
  };

  const handleEliminarCompradorForm = (compId) => {
    setRecCompradores((prev) => (prev || []).filter((c) => c && c.id !== compId));
  };

  const handleRegistrarRecaudo = (e) => {
    e.preventDefault();
    if (esMesCerrado(recFecha)) {
      showToast('No se pueden registrar ni modificar recaudos en un mes cerrado oficialmente por el Pastor.', 'error');
      return;
    }
    const nombreResponsable = usuarioLogueadoRecaudador ? usuarioLogueadoRecaudador.nombre : 'Recaudador';
    
    const actividadFinal = (recActividadLibre || '').trim();
    if (!actividadFinal) {
      showToast('Escribe el nombre de la actividad.', 'error');
      return;
    }

    if (modoRecaudo === 'UNIDADES') {
      const producidas = Number(recCantidadProducida) || 0;
      const precio = Number(recPrecioUnitario) || 0;
      const valorRecaudadoEnMano = resumenFormUnidades.plataRecaudada;
      const descFinal =
        (recDescripcion || '').trim() ||
        `Producción de ${producidas} unidades a ${formatCOP(precio)} c/u (${resumenFormUnidades.unidadesPagadas} pagadas, ${resumenFormUnidades.unidadesFiadas} fiadas)`;

      if (editingRecaudoId) {
        const itemEdit = movimientos.find(m => m && m.id === editingRecaudoId);
        if (itemEdit && esMesCerrado(itemEdit.fecha)) {
          showToast('Este registro pertenece a un mes cerrado oficialmente.', 'error');
          return;
        }
        const actualizados = (movimientos || []).map((m) =>
          m && m.id === editingRecaudoId
            ? {
                ...m,
                fecha: recFecha,
                modoRegistro: 'UNIDADES',
                actividad: actividadFinal,
                descripcion: descFinal,
                responsable: nombreResponsable,
                metodoPago: recMetodo,
                cantidadProducida: producidas,
                precioUnitario: precio,
                compradores: [...(recCompradores || [])],
                montoReportado: valorRecaudadoEnMano,
                edicionAutorizada: false,
                solicitudEdicion: false,
                motivoEdicion: '',
              }
            : m
        );
        setMovimientos(actualizados);
        guardarEnNube(actualizados, usuariosSistema, configuracionApp, cierresMensuales);
        setEditingRecaudoId(null);
        setRecDescripcion('');
        setRecActividadLibre('');
        setRecCompradores([]);
        showToast('Recaudo por unidades modificado con éxito.');
        return;
      }

      const nuevoId = `REC-${Math.floor(100 + Math.random() * 900)}`;
      const nuevoReg = {
        id: nuevoId,
        fecha: recFecha,
        tipo: 'INGRESO',
        modoRegistro: 'UNIDADES',
        actividad: actividadFinal,
        descripcion: descFinal,
        responsable: nombreResponsable,
        metodoPago: recMetodo,
        cantidadProducida: producidas,
        precioUnitario: precio,
        compradores: [...(recCompradores || [])],
        montoReportado: valorRecaudadoEnMano,
        montoRecibido: 0,
        montoSalida: 0,
        estado: 'PENDIENTE',
        notaTesorero: '',
        ultimoAbonoReportado: 0
      };

      const actualizados = [nuevoReg, ...(movimientos || [])];
      setMovimientos(actualizados);
      guardarEnNube(actualizados, usuariosSistema, configuracionApp, cierresMensuales);
      setExpandedRows((prev) => ({ ...prev, [nuevoId]: true }));
      setRecDescripcion('');
      setRecActividadLibre('');
      setRecCompradores([]);
      showToast('Recaudo registrado y enviado a Tesorería.');
      return;
    }

    const valor = Number(recMonto.toString().replace(/\D/g, ''));
    if (!recDescripcion.trim() || valor <= 0) {
      showToast('Completa la descripción y un monto válido.', 'error');
      return;
    }

    if (editingRecaudoId) {
      const itemEdit = movimientos.find(m => m && m.id === editingRecaudoId);
      if (itemEdit && esMesCerrado(itemEdit.fecha)) {
        showToast('Este registro pertenece a un mes cerrado oficialmente.', 'error');
        return;
      }
      const actualizados = (movimientos || []).map((m) =>
        m && m.id === editingRecaudoId
          ? {
              ...m,
              fecha: recFecha,
              modoRegistro: 'GENERAL',
              actividad: actividadFinal,
              descripcion: recDescripcion.trim(),
              responsable: nombreResponsable,
              metodoPago: recMetodo,
              montoReportado: valor,
              edicionAutorizada: false,
              solicitudEdicion: false,
              motivoEdicion: '',
            }
          : m
      );
      setMovimientos(actualizados);
      guardarEnNube(actualizados, usuariosSistema, configuracionApp, cierresMensuales);
      setEditingRecaudoId(null);
      setRecDescripcion('');
      setRecActividadLibre('');
      setRecMonto('');
      showToast('Recaudo general modificado.');
      return;
    }

    const nuevoReg = {
      id: `REC-${Math.floor(100 + Math.random() * 900)}`,
      fecha: recFecha,
      tipo: 'INGRESO',
      modoRegistro: 'GENERAL',
      actividad: actividadFinal,
      descripcion: recDescripcion.trim(),
      responsable: nombreResponsable,
      metodoPago: recMetodo,
      montoReportado: valor,
      montoRecibido: 0,
      montoSalida: 0,
      estado: 'PENDIENTE',
      notaTesorero: '',
      ultimoAbonoReportado: 0
    };

    const actualizados = [nuevoReg, ...(movimientos || [])];
    setMovimientos(actualizados);
    guardarEnNube(actualizados, usuariosSistema, configuracionApp, cierresMensuales);
    setRecDescripcion('');
    setRecActividadLibre('');
    setRecMonto('');
    showToast('Recaudo general enviado a Tesorería.');
  };

  const handleIniciarEdicion = (item) => {
    if (!item) return;
    if (esMesCerrado(item.fecha)) {
      showToast('Este registro pertenece a un mes cerrado oficialmente por el Pastor. No se puede editar.', 'error');
      return;
    }
    if (!item.edicionAutorizada) {
      showToast('Necesitas solicitar autorización de edición a Tesorería.', 'warning');
      return;
    }
    setEditingRecaudoId(item.id);
    setRecFecha(item.fecha || new Date().toISOString().split('T')[0]);
    setRecActividadLibre(item.actividad || '');
    setRecDescripcion(item.descripcion || '');
    setRecMetodo(item.metodoPago || 'Efectivo');
    if (item.modoRegistro === 'UNIDADES') {
      setModoRecaudo('UNIDADES');
      setRecCantidadProducida(String(item.cantidadProducida || 30));
      setRecPrecioUnitario(String(item.precioUnitario || 12000));
      setRecCompradores(Array.isArray(item.compradores) ? [...item.compradores] : []);
    } else {
      setModoRecaudo('GENERAL');
      setRecMonto(String(item.montoReportado || 0));
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
    showToast('Modo edición activado. Puedes corregir cantidades y compradores.');
  };

  const handleEnviarSolicitudEdicion = (e) => {
    e.preventDefault();
    if (!solicitudEdicionModal) return;
    if (esMesCerrado(solicitudEdicionModal.fecha)) {
      showToast('Este registro pertenece a un mes cerrado oficialmente por el Pastor.', 'error');
      return;
    }
    const motivo = (motivoSolicitudEdicion || '').trim();
    if (!motivo) return;

    const actualizados = (movimientos || []).map((m) =>
      m && m.id === solicitudEdicionModal.id ? { ...m, solicitudEdicion: true, motivoEdicion: motivo } : m
    );
    setMovimientos(actualizados);
    guardarEnNube(actualizados, usuariosSistema, configuracionApp, cierresMensuales);
    showToast('Solicitud de edición enviada a Tesorería.');
    setSolicitudEdicionModal(null);
    setMotivoSolicitudEdicion('');
  };

  const handleAutorizarEdicionTesorero = (item, aprobar) => {
    if (!item) return;
    if (esMesCerrado(item.fecha)) {
      showToast('Este registro pertenece a un mes cerrado oficialmente por el Pastor.', 'error');
      return;
    }
    const actualizados = (movimientos || []).map((m) =>
      m && m.id === item.id
        ? {
            ...m,
            edicionAutorizada: aprobar,
            solicitudEdicion: false,
            notaTesorero: aprobar
              ? `${m.notaTesorero ? m.notaTesorero + ' | ' : ''}[Edición autorizada]`
              : `${m.notaTesorero ? m.notaTesorero + ' | ' : ''}[Edición rechazada]`,
          }
        : m
    );
    setMovimientos(actualizados);
    guardarEnNube(actualizados, usuariosSistema, configuracionApp, cierresMensuales);
    showToast(aprobar ? 'Edición autorizada.' : 'Solicitud rechazada.');
  };

  const openAbonoModal = (movimiento, comprador) => {
    if (!movimiento || !comprador) return;
    if (esMesCerrado(movimiento.fecha)) {
      showToast('Este registro pertenece a un mes cerrado oficialmente por el Pastor. No se puede abonar.', 'error');
      return;
    }
    const precio = Number(movimiento.precioUnitario) || 0;
    const totalComp = (Number(comprador.cantidad) || 0) * precio;
    const abonadoActual =
      comprador.estadoPago === 'PAGADO'
        ? totalComp
        : Math.min(totalComp, Math.max(0, Number(comprador.montoAbonado) || 0));
    const saldoPendiente = Math.max(0, totalComp - abonadoActual);

    setAbonoModal({
      movimientoId: movimiento.id,
      comprador,
      saldoPendiente,
    });
    setValorAbonoInput(String(saldoPendiente));
  };

  const handleConfirmarAbono = (e) => {
    e.preventDefault();
    if (!abonoModal) return;
    const movTarget = movimientos.find(m => m && m.id === abonoModal.movimientoId);
    if (movTarget && esMesCerrado(movTarget.fecha)) {
      showToast('Este registro pertenece a un mes cerrado oficialmente por el Pastor.', 'error');
      return;
    }
    const abonoNuevo = Number(valorAbonoInput.toString().replace(/\D/g, '')) || 0;
    if (abonoNuevo <= 0) return;

    const actualizados = (movimientos || []).map((m) => {
      if (!m || m.id !== abonoModal.movimientoId || m.modoRegistro !== 'UNIDADES') return m;
      const precio = Number(m.precioUnitario) || 0;
      
      const comps = (Array.isArray(m.compradores) ? m.compradores : []).map((c) => {
        if (!c || c.id !== abonoModal.comprador.id) return c;
        const totalC = (Number(c.cantidad) || 0) * precio;
        const abonadoPrevio =
          c.estadoPago === 'PAGADO'
            ? totalC
            : Math.min(totalC, Math.max(0, Number(c.montoAbonado) || 0));
        const nuevoTotalAbonado = Math.min(totalC, abonadoPrevio + abonoNuevo);
        const saldado = nuevoTotalAbonado >= totalC;
        return {
          ...c,
          montoAbonado: nuevoTotalAbonado,
          estadoPago: saldado ? 'PAGADO' : 'FIADO',
        };
      });

      const invCalculado = calcularResumenInventario({ ...m, compradores: comps });
      const plataPagadaActualizada = invCalculado.plataPagada;

      const yaSeEntregoAlgo = (Number(m.montoRecibido) || 0) > 0;

      if (!yaSeEntregoAlgo) {
        return {
          ...m,
          compradores: comps,
          montoReportado: plataPagadaActualizada,
          ultimoAbonoReportado: 0,
          notaTesorero: `${m.notaTesorero || ''} [Abono sumado antes de entrega: +${formatCOP(abonoNuevo)}]`,
          estado: 'PENDIENTE'
        };
      } else {
        const abonoPrevioAcumulado = Number(m.ultimoAbonoReportado) || 0;
        const nuevoAbonoAcumulado = abonoPrevioAcumulado + abonoNuevo;
        return { 
          ...m, 
          compradores: comps, 
          ultimoAbonoReportado: nuevoAbonoAcumulado,
          notaTesorero: `${m.notaTesorero || ''} [Nuevo abono reportado: +${formatCOP(abonoNuevo)}]`,
          estado: 'PENDIENTE'
        };
      }
    });

    setMovimientos(actualizados);
    guardarEnNube(actualizados, usuariosSistema, configuracionApp, cierresMensuales);
    showToast(`Abono de ${formatCOP(abonoNuevo)} actualizado en el total por entregar a Tesorería.`);
    setAbonoModal(null);
  };

  const handleSaldarTodoComprador = (movimientoId, compradorId) => {
    const movTarget = movimientos.find(m => m && m.id === movimientoId);
    if (movTarget && esMesCerrado(movTarget.fecha)) {
      showToast('Este registro pertenece a un mes cerrado oficialmente por el Pastor. No se puede modificar.', 'error');
      return;
    }
    let valorAbonadoExtra = 0;
    const actualizados = (movimientos || []).map((m) => {
      if (!m || m.id !== movimientoId || m.modoRegistro !== 'UNIDADES') return m;
      const precio = Number(m.precioUnitario) || 0;
      const comps = (Array.isArray(m.compradores) ? m.compradores : []).map((c) => {
        if (!c || c.id !== compradorId) return c;
        const totalC = (Number(c.cantidad) || 0) * precio;
        const abonadoPrevio = c.estadoPago === 'PAGADO' ? totalC : Math.min(totalC, Math.max(0, Number(c.montoAbonado) || 0));
        valorAbonadoExtra = Math.max(0, totalC - abonadoPrevio);
        return { ...c, estadoPago: 'PAGADO', montoAbonado: totalC };
      });

      const invCalculado = calcularResumenInventario({ ...m, compradores: comps });
      const plataPagadaActualizada = invCalculado.plataPagada;
      const yaSeEntregoAlgo = (Number(m.montoRecibido) || 0) > 0;

      if (!yaSeEntregoAlgo) {
        return {
          ...m,
          compradores: comps,
          montoReportado: plataPagadaActualizada,
          ultimoAbonoReportado: 0,
          notaTesorero: `${m.notaTesorero || ''} [Deuda saldada antes de entrega: +${formatCOP(valorAbonadoExtra)}]`,
          estado: 'PENDIENTE'
        };
      } else {
        const abonoPrevioAcumulado = Number(m.ultimoAbonoReportado) || 0;
        const nuevoAbonoAcumulado = abonoPrevioAcumulado + valorAbonadoExtra;
        return { 
          ...m, 
          compradores: comps, 
          ultimoAbonoReportado: nuevoAbonoAcumulado,
          notaTesorero: `${m.notaTesorero || ''} [Deuda saldada por completo: +${formatCOP(valorAbonadoExtra)}]`,
          estado: 'PENDIENTE'
        };
      }
    });
    setMovimientos(actualizados);
    guardarEnNube(actualizados, usuariosSistema, configuracionApp, cierresMensuales);
    showToast('Deuda saldada por completo. Total actualizado para entregar a Tesorería.');
  };

  const kpisRecaudadorLogueado = useMemo(() => {
    if (!usuarioLogueadoRecaudador) return { totalReportado: 0, totalEnMano: 0, totalFiado: 0 };
    const nombreRec = usuarioLogueadoRecaudador.nombre;

    let totalReportado = 0;
    let totalEnMano = 0;
    let totalFiado = 0;

    (movimientos || []).forEach((m) => {
      if (m && m.tipo === 'INGRESO' && m.responsable === nombreRec) {
        const base = Number(m.montoReportado) || 0;
        const abonosExtras = Number(m.ultimoAbonoReportado) || 0;
        totalReportado += base + abonosExtras;

        if (m.modoRegistro === 'UNIDADES' && Array.isArray(m.compradores)) {
          const inv = calcularResumenInventario(m);
          totalEnMano += inv.plataPagada;
          totalFiado += inv.plataFiada;
        } else {
          totalEnMano += base;
        }
      }
    });

    return { totalReportado, totalEnMano, totalFiado };
  }, [movimientos, usuarioLogueadoRecaudador]);

  const kpis = useMemo(() => {
    let totalEntradasVerificadas = 0;
    let totalSalidasNetas = 0;
    let pendientePorRecoger = 0;
    let descuadreAcumulado = 0;
    let cantidadPendientes = 0;
    let cantidadDescuadres = 0;
    let cantidadSolicitudesEdicion = 0;
    let cantidadSolicitudesIncobrable = 0;
    let cantidadSolicitudesBorrado = 0;
    let totalPlataFiadaCalle = 0;
    let totalPlataSinVenderCalle = 0;

    (movimientos || []).forEach((m) => {
      if (!m) return;
      if (m.solicitudBorrado && !m.borradoAutorizado) cantidadSolicitudesBorrado += 1;
      
      if (m.tipo === 'INGRESO') {
        totalEntradasVerificadas += Number(m.montoRecibido) || 0;

        if (m.estado === 'PENDIENTE') {
          const pendienteItem = Number(m.ultimoAbonoReportado) > 0 
            ? Number(m.ultimoAbonoReportado) 
            : Number(m.montoReportado) || 0;
          pendientePorRecoger += pendienteItem;
          cantidadPendientes += 1;
        } else if (m.estado === 'DESCUADRE') {
          const diff = Math.abs((Number(m.montoReportado) || 0) - (Number(m.montoRecibido) || 0));
          descuadreAcumulado += diff;
          cantidadDescuadres += 1;
        }
        if (m.solicitudEdicion) cantidadSolicitudesEdicion += 1;

        if (m.modoRegistro === 'UNIDADES' && Array.isArray(m.compradores)) {
          m.compradores.forEach((c) => {
            if (c && c.solicitudIncobrable) cantidadSolicitudesIncobrable += 1;
          });
          const inv = calcularResumenInventario(m);
          totalPlataFiadaCalle += inv.plataFiada;
          totalPlataSinVenderCalle += inv.plataSinVender;
        }
      } else if (m.tipo === 'EGRESO') {
        const salidaReal = (Number(m.montoSalida) || 0) - (Number(m.montoSobranteDevuelto) || 0);
        totalSalidasNetas += Math.max(0, salidaReal);
      }
    });

    const saldoRealEnCaja = totalEntradasVerificadas - totalSalidasNetas;
    const totalCarteraYSinVender = totalPlataFiadaCalle + totalPlataSinVenderCalle;

    return {
      totalEntradasVerificadas,
      totalSalidas: totalSalidasNetas,
      saldoRealEnCaja,
      pendientePorRecoger,
      descuadreAcumulado,
      cantidadPendientes,
      cantidadDescuadres,
      cantidadSolicitudesEdicion,
      cantidadSolicitudesIncobrable,
      cantidadSolicitudesBorrado,
      totalCarteraYSinVender,
    };
  }, [movimientos]);

  const handleRecaudadorLogin = (e) => {
    e.preventDefault();
    const uInput = (recUserLoginInput || '').trim().toLowerCase();
    const pInput = (recPassLoginInput || '').trim();

    const encontrado = (usuariosSistema || []).find(
      (u) => u && u.rol === 'RECAUDADOR' && u.usuario && u.usuario.toLowerCase() === uInput && u.clave === pInput
    );

    if (!encontrado) {
      setRecLoginError('Usuario o clave incorrectos.');
      return;
    }

    if (!encontrado.activo) {
      setRecLoginError('Este usuario se encuentra INACTIVO. Contacta al administrador.');
      return;
    }

    setUsuarioLogueadoRecaudador(encontrado);
    setRecLoginError('');
    setRecUserLoginInput('');
    setRecPassLoginInput('');
    showToast(`Bienvenido(a), ${encontrado.nombre}.`);
  };

  const handleTesoreroLogin = (e) => {
    e.preventDefault();
    const uInput = (tesUserLoginInput || '').trim().toLowerCase();
    const pInput = (tesPassLoginInput || '').trim();

    const encontrado = (usuariosSistema || []).find(
      (u) => u && u.rol === 'TESORERO' && u.usuario && u.usuario.toLowerCase() === uInput && u.clave === pInput
    );

    if (!encontrado) {
      setTesLoginError('Usuario o clave incorrectos.');
      return;
    }

    if (!encontrado.activo) {
      setTesLoginError('Este usuario Tesorero se encuentra INACTIVO.');
      return;
    }

    setUsuarioLogueadoTesorero(encontrado);
    setTesLoginError('');
    setTesUserLoginInput('');
    setTesPassLoginInput('');
    showToast(`Sesión de Tesorería iniciada: ${encontrado.nombre}.`);
  };

  const handleAdminLogin = (e) => {
    e.preventDefault();
    const uInput = (adminUserLoginInput || '').trim().toLowerCase();
    const pInput = (adminPassLoginInput || '').trim();

    const encontrado = (usuariosSistema || []).find(
      (u) => u && u.rol === 'ADMINISTRADOR' && u.usuario && u.usuario.toLowerCase() === uInput && u.clave === pInput
    );

    if (!encontrado) {
      setAdminLoginError('Usuario o clave de administrador incorrectos.');
      return;
    }

    if (!encontrado.activo) {
      setAdminLoginError('Este usuario Administrador se encuentra INACTIVO.');
      return;
    }

    setUsuarioLogueadoAdmin(encontrado);
    setAdminLoginError('');
    setAdminUserLoginInput('');
    setAdminPassLoginInput('');
    showToast(`Sesión de Administrador iniciada: ${encontrado.nombre}.`);
  };

  const openArqueoModal = (item) => {
    if (!item) return;
    if (esMesCerrado(item.fecha)) {
      showToast('Este registro pertenece a un mes cerrado oficialmente por el Pastor. No se puede realizar arqueo.', 'error');
      return;
    }
    setArqueoItem(item);
    const montoPendienteARecibir = Number(item.ultimoAbonoReportado) > 0 ? Number(item.ultimoAbonoReportado) : Number(item.montoReportado || 0);
    setMontoFisicoContado(String(montoPendienteARecibir));
    setNotaArqueo(item.notaTesorero || '');
  };

  const handleConfirmarArqueo = (e) => {
    e.preventDefault();
    if (!arqueoItem) return;
    if (esMesCerrado(arqueoItem.fecha)) {
      showToast('Este registro pertenece a un mes cerrado oficialmente por el Pastor.', 'error');
      return;
    }
    const contado = Number(montoFisicoContado.toString().replace(/\D/g, ''));
    
    // El monto que se esperaba recibir en este arqueo específico
    const reportadoEsperado = Number(arqueoItem.ultimoAbonoReportado) > 0 
      ? Number(arqueoItem.ultimoAbonoReportado) 
      : Number(arqueoItem.montoReportado || 0);
      
    const esExacto = contado === reportadoEsperado;
    const nombreTesoreroActual = usuarioLogueadoTesorero ? usuarioLogueadoTesorero.nombre : 'Tesorero';

    const actualizados = (movimientos || []).map((m) => {
      if (m && m.id === arqueoItem.id) {
        const recibidoAnterior = Number(m.montoRecibido) || 0;
        // Sumamos al recibido real únicamente lo que el tesorero contó físicamente
        const totalRecibidoReal = recibidoAnterior + contado;
        
        // Si había abonos acumulados, consolidamos el monto reportado total
        const nuevoReportadoTotal = Number(m.ultimoAbonoReportado) > 0 
          ? (Number(m.montoReportado) || 0) + Number(m.ultimoAbonoReportado) 
          : Number(m.montoReportado || 0);

        return {
          ...m,
          montoReportado: nuevoReportadoTotal,
          montoRecibido: totalRecibidoReal,
          estado: esExacto ? 'VERIFICADO' : 'DESCUADRE',
          edicionAutorizada: false,
          solicitudEdicion: false,
          ultimoAbonoReportado: 0,
          notaTesorero:
            (notaArqueo || '').trim() ||
            (esExacto
              ? `Recibido por ${nombreTesoreroActual} (${formatCOP(contado)}).`
              : `Recibido por ${nombreTesoreroActual}. Faltaron ${formatCOP(reportadoEsperado - contado)} (Contó ${formatCOP(contado)} de ${formatCOP(reportadoEsperado)}).`),
        };
      }
      return m;
    });

    setMovimientos(actualizados);
    guardarEnNube(actualizados, usuariosSistema, configuracionApp, cierresMensuales);
    setArqueoItem(null);
    showToast(esExacto ? 'Dinero recibido y sumado a caja correctamente.' : 'Arqueo guardado con descuadre reflejado.');
  };

  const handleCerrarRecaudoSinMasNovedad = (item) => {
    if (!item) return;
    if (esMesCerrado(item.fecha)) {
      showToast('Este registro pertenece a un mes cerrado oficialmente por el Pastor.', 'error');
      return;
    }
    const nombreTesoreroActual = usuarioLogueadoTesorero ? usuarioLogueadoTesorero.nombre : 'Tesorero';
    const abonoPendiente = Number(item.ultimoAbonoReportado) > 0 ? Number(item.ultimoAbonoReportado) : Number(item.montoReportado || 0);

    const actualizados = (movimientos || []).map((m) => {
      if (m && m.id === item.id) {
        const recibidoAnterior = Number(m.montoRecibido) || 0;
        const nuevoReportadoTotal = Number(m.ultimoAbonoReportado) > 0 
          ? (Number(m.montoReportado) || 0) + Number(m.ultimoAbonoReportado) 
          : Number(m.montoReportado || 0);

        return {
          ...m,
          montoReportado: nuevoReportadoTotal,
          estado: 'VERIFICADO',
          montoRecibido: recibidoAnterior + abonoPendiente,
          edicionAutorizada: false,
          solicitudEdicion: false,
          ultimoAbonoReportado: 0,
          notaTesorero: `${m.notaTesorero ? m.notaTesorero + ' | ' : ''}Cerrado por ${nombreTesoreroActual} (${formatCOP(abonoPendiente)}).`
        };
      }
      return m;
    });
    setMovimientos(actualizados);
    guardarEnNube(actualizados, usuariosSistema, configuracionApp, cierresMensuales);
    showToast('Recaudo cerrado y verificado definitivamente en caja.');
  };

  const handleAprobarAjusteDescuadre = (item) => {
    if (!item) return;
    if (esMesCerrado(item.fecha)) {
      showToast('Este registro pertenece a un mes cerrado oficialmente por el Pastor.', 'error');
      return;
    }
    const actualizados = (movimientos || []).map((m) => {
      if (m && m.id === item.id) {
        return {
          ...m,
          montoReportado: m.montoRecibido,
          estado: 'VERIFICADO',
          edicionAutorizada: false,
          notaTesorero: `${m.notaTesorero || ''} [Ajuste aprobado por Tesorería y cerrado]`,
        };
      }
      return m;
    });
    setMovimientos(actualizados);
    guardarEnNube(actualizados, usuariosSistema, configuracionApp, cierresMensuales);
    showToast('Ajuste de descuadre aprobado y cerrado.');
  };

  const handleRegistrarEgreso = (e) => {
    e.preventDefault();
    if (esMesCerrado(egrFecha)) {
      showToast('No se pueden registrar egresos en un mes cerrado oficialmente por el Pastor.', 'error');
      return;
    }
    const valorSalida = Number(egrMonto.toString().replace(/\D/g, ''));
    const sobrante = Number(egrSobranteDevuelto.toString().replace(/\D/g, '')) || 0;

    if (!egrConcepto.trim() || !egrResponsable.trim() || valorSalida <= 0) {
      showToast('Completa todos los campos del egreso.', 'error');
      return;
    }

    if (sobrante >= valorSalida) {
      showToast('El sobrante devuelto no puede ser mayor o igual al valor entregado.', 'error');
      return;
    }

    const nombreTesoreroActual = usuarioLogueadoTesorero ? usuarioLogueadoTesorero.nombre : 'Tesorero';

    const nuevoEgreso = {
      id: `EGR-${Math.floor(100 + Math.random() * 900)}`,
      fecha: egrFecha,
      tipo: 'EGRESO',
      actividad: egrCategoria,
      descripcion: egrConcepto.trim(),
      responsable: `${egrResponsable.trim()} (Autoriza: ${nombreTesoreroActual})`,
      metodoPago: 'Efectivo Caja',
      montoReportado: 0,
      montoRecibido: 0,
      montoSalida: valorSalida,
      montoSobranteDevuelto: sobrante,
      estado: 'EGRESO_REGISTRADO',
      notaTesorero: (egrNota || '').trim() + (sobrante > 0 ? ` [Sobrante devuelto y retornado a caja: ${formatCOP(sobrante)}]` : ''),
      ultimoAbonoReportado: 0
    };

    const actualizados = [nuevoEgreso, ...(movimientos || [])];
    setMovimientos(actualizados);
    guardarEnNube(actualizados, usuariosSistema, configuracionApp, cierresMensuales);
    setEgrConcepto('');
    setEgrMonto('');
    setEgrNota('');
    setEgrSobranteDevuelto('');
    showToast(`Salida registrada por ${formatCOP(valorSalida)}${sobrante > 0 ? ` (Sobrante devuelto de ${formatCOP(sobrante)} sumado a caja)` : ''}.`);
    setTesoreroTab('LIBRO');
  };

  const handleExportCSV = () => {
    const headers = [
      'ID', 'Fecha', 'Tipo', 'Actividad', 'Descripción', 'Responsable', 'Reportado', 'Entrada Real', 'Salida Neta', 'Sobrante Devuelto', 'Estado', 'Nota'
    ];
    const rows = (movimientos || []).map((m) => [
      m.id, m.fecha, m.tipo, `"${m.actividad}"`, `"${m.descripcion}"`, `"${m.responsable}"`,
      m.montoReportado, m.montoRecibido, m.montoSalida, m.montoSobranteDevuelto || 0, m.estado, `"${m.notaTesorero || ''}"`
    ]);
    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((e) => e.join(';'))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Libro_Tesoreria_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Libro exportado a Excel con éxito.');
  };

  const movimientosFiltrados = useMemo(() => {
    return (movimientos || [])
      .filter((m) => {
        if (!m) return false;
        if (filtroLibro === 'TODOS') return true;
        if (filtroLibro === 'INGRESOS') return m.tipo === 'INGRESO';
        if (filtroLibro === 'EGRESOS') return m.tipo === 'EGRESO';
        return m.estado === filtroLibro;
      })
      .filter((m) => {
        if (!m) return false;
        if (!busquedaLibro.trim()) return true;
        const q = busquedaLibro.toLowerCase();
        return (
          (m.actividad || '').toLowerCase().includes(q) ||
          (m.descripcion || '').toLowerCase().includes(q) ||
          (m.responsable || '').toLowerCase().includes(q) ||
          (m.id || '').toLowerCase().includes(q)
        );
      })
      .sort((a, b) => new Date(b.fecha || 0) - new Date(a.fecha || 0));
  }, [movimientos, filtroLibro, busquedaLibro]);

  const renderEstadoBadge = (m) => {
    if (!m) return null;
    const mesCerradoActual = esMesCerrado(m.fecha);

    return (
      <div className="flex items-center gap-1.5 flex-wrap justify-end">
        {mesCerradoActual && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-800 border border-slate-300">
            <Lock className="w-3 h-3 text-slate-600" />
            Mes Cerrado
          </span>
        )}
        {m.estado === 'VERIFICADO' && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Recibido / Verificado
          </span>
        )}
        {m.estado === 'PENDIENTE' && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            Pendiente por recibir
          </span>
        )}
        {m.estado === 'DESCUADRE' && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            Descuadre en revisión
          </span>
        )}
        {m.estado === 'EGRESO_REGISTRADO' && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <ArrowDownRight className="w-3.5 h-3.5 text-rose-500" />
            Salida de Caja
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-16">
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          .acta-imprimible-container, .acta-imprimible-container * {
            visibility: visible !important;
          }
          .acta-imprimible-container {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 20px !important;
            box-shadow: none !important;
            border: none !important;
            background: white !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {toast && (
        <div className="fixed bottom-5 right-5 z-50 max-w-md animate-bounce">
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl border text-sm font-medium ${
              toast.type === 'error'
                ? 'bg-rose-900 text-white border-rose-700'
                : toast.type === 'warning'
                ? 'bg-amber-900 text-white border-amber-700'
                : 'bg-indigo-950 text-white border-indigo-800'
            }`}
          >
            {toast.type === 'error' || toast.type === 'warning' ? (
              <AlertTriangle className="w-5 h-5 text-amber-300 shrink-0" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            )}
            <span>{toast.message}</span>
            <button onClick={() => setToast(null)} className="ml-2 text-slate-300 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <header className="bg-indigo-950 text-white shadow-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              {configuracionApp.logoUrl ? (
                <img
                  src={configuracionApp.logoUrl}
                  alt="Logo"
                  className="w-12 h-12 rounded-xl object-cover border border-indigo-700 shadow-inner bg-white"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              ) : (
                <div className="bg-indigo-800 p-2.5 rounded-xl border border-indigo-700 shadow-inner">
                  <Wallet className="w-7 h-7 text-emerald-400" />
                </div>
              )}
              <div>
                <h1 className="text-xl font-bold tracking-tight text-white">
                  {configuracionApp.titulo}
                </h1>
                <p className="text-xs text-indigo-200">
                  {configuracionApp.subtitulo}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 bg-indigo-900/90 p-1.5 rounded-xl border border-indigo-800">
              <button
                onClick={() => setActiveRole('RECAUDADOR')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                  activeRole === 'RECAUDADOR'
                    ? 'bg-white text-indigo-950 shadow-sm'
                    : 'text-indigo-200 hover:text-white hover:bg-indigo-800/50'
                }`}
              >
                {usuarioLogueadoRecaudador ? <Unlock className="w-3.5 h-3.5 text-emerald-600" /> : <Lock className="w-3.5 h-3.5" />}
                <span>Recaudador</span>
              </button>

              <button
                onClick={() => setActiveRole('TESORERO')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                  activeRole === 'TESORERO'
                    ? 'bg-emerald-500 text-indigo-950 shadow-sm'
                    : 'text-indigo-200 hover:text-white hover:bg-indigo-800/50'
                }`}
              >
                {usuarioLogueadoTesorero ? <Unlock className="w-3.5 h-3.5 text-indigo-950" /> : <Lock className="w-3.5 h-3.5" />}
                <span>Tesorería</span>
                {(kpis.cantidadPendientes + kpis.cantidadSolicitudesIncobrable) > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 text-[10px] font-extrabold rounded-full bg-amber-400 text-indigo-950">
                    {kpis.cantidadPendientes + kpis.cantidadSolicitudesIncobrable}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveRole('ADMINISTRADOR')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                  activeRole === 'ADMINISTRADOR'
                    ? 'bg-amber-400 text-indigo-950 shadow-sm'
                    : 'text-indigo-200 hover:text-white hover:bg-indigo-800/50'
                }`}
              >
                {usuarioLogueadoAdmin ? <Unlock className="w-3.5 h-3.5 text-indigo-950" /> : <ShieldAlert className="w-3.5 h-3.5 text-amber-300" />}
                <span>Pastor / Admin</span>
                {(kpis.cantidadSolicitudesBorrado + ((usuariosSistema || []).some(u => u && u.solicitudClave) ? 1 : 0)) > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 text-[10px] font-extrabold rounded-full bg-rose-600 text-white animate-pulse">
                    {kpis.cantidadSolicitudesBorrado + ((usuariosSistema || []).some(u => u && u.solicitudClave) ? 1 : 0)}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {activeRole === 'RECAUDADOR' && (
          <>
            {!usuarioLogueadoRecaudador ? (
              <div className="max-w-md mx-auto mt-16 bg-white rounded-2xl shadow-xl border border-slate-200 p-8 text-center">
                <div className="w-14 h-14 bg-indigo-100 text-indigo-900 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
                  <HandCoins className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Ingreso Recaudadores</h2>
                <p className="text-sm text-slate-500 mt-1">Ingresa tu usuario y clave asignados.</p>

                <form onSubmit={handleRecaudadorLogin} className="mt-6 space-y-4 text-left">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Usuario</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. marta"
                      value={recUserLoginInput}
                      onChange={(e) => setRecUserLoginInput(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white outline-none focus:ring-2 focus:ring-indigo-600 font-medium"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Contraseña / Clave</label>
                    <input
                      type="password"
                      required
                      placeholder="••••"
                      value={recPassLoginInput}
                      onChange={(e) => setRecPassLoginInput(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white outline-none focus:ring-2 focus:ring-indigo-600 font-medium"
                    />
                  </div>
                  {recLoginError && (
                    <p className="text-xs text-rose-600 font-semibold">{recLoginError}</p>
                  )}

                  <div className="flex items-center justify-between text-xs pt-1">
                    <button
                      type="button"
                      onClick={() => setShowOlvidoClaveModal(true)}
                      className="text-indigo-700 hover:underline font-bold flex items-center gap-1"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      ¿Se te olvidó tu clave?
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowRestablecerClaveModal(true)}
                      className="text-emerald-700 hover:underline font-bold flex items-center gap-1"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      Tengo autorización
                    </button>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-indigo-950 hover:bg-indigo-900 text-white font-bold text-sm shadow-md transition-all mt-2"
                  >
                    Entrar al Módulo
                  </button>
                </form>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-sm font-bold text-slate-800">
                      Recaudador Conectado: <span className="text-indigo-900 underline">{usuarioLogueadoRecaudador.nombre}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowCambioClaveRecaudadorModal(true)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-900 text-xs font-bold transition-all"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      Cambiar mi Clave
                    </button>
                    <button
                      onClick={() => setUsuarioLogueadoRecaudador(null)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition-all"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      Cerrar Sesión
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-indigo-950 text-white p-4 rounded-2xl shadow-sm border border-indigo-900">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-200 block">Total Reportado por Ti</span>
                    <span className="text-xl font-extrabold text-emerald-400 mt-1 block">{formatCOP(kpisRecaudadorLogueado.totalReportado)}</span>
                    <span className="text-[10px] text-indigo-200 mt-0.5 block">Incluye efectivo inicial y abonos</span>
                  </div>
                  <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">Efectivo / Pagos en Mano</span>
                    <span className="text-xl font-extrabold text-slate-900 mt-1 block">{formatCOP(kpisRecaudadorLogueado.totalEnMano)}</span>
                    <span className="text-[10px] text-slate-400 mt-0.5 block">Recibidos al contado</span>
                  </div>
                  <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">Cartera Fiada Pendiente</span>
                    <span className="text-xl font-extrabold text-rose-600 mt-1 block">{formatCOP(kpisRecaudadorLogueado.totalFiado)}</span>
                    <span className="text-[10px] text-slate-400 mt-0.5 block">Por cobrar en calle</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  <div className="lg:col-span-5">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden sticky top-24">
                      <div className={`px-6 py-4 text-white ${editingRecaudoId ? 'bg-amber-700' : 'bg-indigo-950'}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {editingRecaudoId ? <Edit3 className="w-5 h-5 text-amber-300" /> : <PlusCircle className="w-5 h-5 text-emerald-400" />}
                            <h2 className="font-bold text-base">
                              {editingRecaudoId ? 'Modificar Recaudo y Compradores' : 'Registrar Recaudo de Actividad'}
                            </h2>
                          </div>
                          {editingRecaudoId && (
                            <button
                              onClick={() => {
                                setEditingRecaudoId(null);
                                setRecDescripcion('');
                                setRecActividadLibre('');
                                setRecCompradores([]);
                              }}
                              className="px-2.5 py-1 rounded bg-white/20 text-xs font-bold hover:bg-white/30"
                            >
                              Cancelar
                            </button>
                          )}
                        </div>
                        <p className="text-xs text-indigo-200 mt-0.5">
                          Registra como: <strong className="text-white">{usuarioLogueadoRecaudador.nombre}</strong>
                        </p>
                      </div>

                      {esMesCerrado(recFecha) && (
                        <div className="bg-rose-50 border-b border-rose-200 p-3 text-xs text-rose-800 font-bold flex items-center gap-2">
                          <Lock className="w-4 h-4 text-rose-600 shrink-0" />
                          <span>Este mes ya está cerrado oficialmente por el Pastor. No se permiten registros ni cambios.</span>
                        </div>
                      )}

                      <form onSubmit={handleRegistrarRecaudo} className="p-6 space-y-4">
                        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200">
                          <button
                            type="button"
                            onClick={() => setModoRecaudo('UNIDADES')}
                            className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                              modoRecaudo === 'UNIDADES' ? 'bg-indigo-950 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            <Package className="w-3.5 h-3.5" />
                            Por Unidades / Inventario
                          </button>
                          <button
                            type="button"
                            onClick={() => setModoRecaudo('GENERAL')}
                            className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                              modoRecaudo === 'GENERAL' ? 'bg-indigo-950 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            <Banknote className="w-3.5 h-3.5" />
                            Monto General
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Fecha</label>
                            <input
                              type="date"
                              required
                              value={recFecha}
                              onChange={(e) => setRecFecha(e.target.value)}
                              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Nombre de la Actividad</label>
                            <input
                              type="text"
                              required
                              placeholder="Ej. Venta de Tamales, Rifa Pro-Templo..."
                              value={recActividadLibre}
                              onChange={(e) => setRecActividadLibre(e.target.value)}
                              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white font-medium"
                            />
                          </div>
                        </div>

                        {modoRecaudo === 'UNIDADES' ? (
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-3 bg-indigo-50/70 p-3.5 rounded-xl border border-indigo-100">
                              <div>
                                <label className="block text-[11px] font-bold uppercase text-indigo-950 mb-1">Cantidad Producida</label>
                                <input
                                  type="number"
                                  min="1"
                                  required
                                  value={recCantidadProducida}
                                  onChange={(e) => setRecCantidadProducida(e.target.value)}
                                  className="w-full px-3 py-2 rounded-lg border border-indigo-200 bg-white text-sm font-extrabold text-slate-900"
                                />
                              </div>
                              <div>
                                <label className="block text-[11px] font-bold uppercase text-indigo-950 mb-1">Precio Unitario ($)</label>
                                <input
                                  type="number"
                                  min="100"
                                  step="100"
                                  required
                                  value={recPrecioUnitario}
                                  onChange={(e) => setRecPrecioUnitario(e.target.value)}
                                  className="w-full px-3 py-2 rounded-lg border border-indigo-200 bg-white text-sm font-extrabold text-slate-900"
                                />
                              </div>
                              <div className="col-span-2 flex items-center justify-between pt-2 border-t border-indigo-200 text-xs">
                                <span className="font-semibold text-indigo-900">Total Esperado ({resumenFormUnidades.producidas} unid.):</span>
                                <span className="font-extrabold text-indigo-950 text-sm">{formatCOP(resumenFormUnidades.totalEsperado)}</span>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                              <div className="bg-emerald-50 border border-emerald-200 p-2 rounded-xl text-center">
                                <span className="text-[10px] font-bold uppercase text-emerald-800 block">En Mano</span>
                                <span className="text-xs font-extrabold text-emerald-950">{formatCOP(resumenFormUnidades.plataRecaudada)}</span>
                              </div>
                              <div className="bg-rose-50 border border-rose-200 p-2 rounded-xl text-center">
                                <span className="text-[10px] font-bold uppercase text-rose-800 block">Fiados</span>
                                <span className="text-xs font-extrabold text-rose-950">{formatCOP(resumenFormUnidades.plataFiada)}</span>
                              </div>
                              <div className="bg-amber-50 border border-amber-200 p-2 rounded-xl text-center">
                                <span className="text-[10px] font-bold uppercase text-amber-800 block">Incobrables</span>
                                <span className="text-xs font-extrabold text-amber-950">{formatCOP(resumenFormUnidades.plataIncobrable)}</span>
                              </div>
                              <div className="bg-slate-100 border border-slate-200 p-2 rounded-xl text-center">
                                <span className="text-[10px] font-bold uppercase text-slate-700 block">Sin Vender</span>
                                <span className="text-xs font-extrabold text-slate-900">{formatCOP(resumenFormUnidades.plataSinVender)}</span>
                              </div>
                            </div>

                            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold uppercase text-slate-700 flex items-center gap-1.5">
                                  <Users className="w-3.5 h-3.5 text-indigo-700" />
                                  Compradores y Deudores (Editable)
                                </span>
                                <span className="text-[11px] font-semibold text-slate-500">Quedan {resumenFormUnidades.unidadesSinVender} unid. libres</span>
                              </div>

                              <div className="grid grid-cols-12 gap-2">
                                <input
                                  type="text"
                                  placeholder="Nombre persona..."
                                  value={nuevoCompNombre}
                                  onChange={(e) => setNuevoCompNombre(e.target.value)}
                                  className="col-span-5 px-2.5 py-2 rounded-lg border border-slate-300 bg-white text-xs"
                                />
                                <input
                                  type="number"
                                  min="1"
                                  value={nuevoCompCantidad}
                                  onChange={(e) => setNuevoCompCantidad(e.target.value)}
                                  className="col-span-2 px-2 py-2 rounded-lg border border-slate-300 bg-white text-xs font-bold text-center"
                                />
                                <select
                                  value={nuevoCompEstado}
                                  onChange={(e) => setNuevoCompEstado(e.target.value)}
                                  className="col-span-3 px-1 py-2 rounded-lg border border-slate-300 bg-white text-xs font-semibold"
                                >
                                  <option value="PAGADO">Pagado</option>
                                  <option value="FIADO">Fiado</option>
                                </select>
                                <button
                                  type="button"
                                  onClick={handleAgregarCompradorForm}
                                  className="col-span-2 bg-indigo-950 hover:bg-indigo-900 text-white rounded-lg flex items-center justify-center transition-all"
                                >
                                  <UserPlus className="w-4 h-4" />
                                </button>
                              </div>

                              {nuevoCompEstado === 'FIADO' && (
                                <div className="flex items-center justify-between gap-2 bg-amber-50 p-2 rounded-lg border border-amber-200">
                                  <label className="text-[11px] font-bold text-amber-900">Abono inicial ($):</label>
                                  <input
                                    type="number"
                                    min="0"
                                    step="100"
                                    value={nuevoCompAbono}
                                    onChange={(e) => setNuevoCompAbono(e.target.value)}
                                    className="w-32 px-2 py-1 rounded border border-amber-300 bg-white text-xs font-bold text-right"
                                  />
                                </div>
                              )}

                              {Array.isArray(recCompradores) && recCompradores.length > 0 && (
                                <div className="max-h-52 overflow-y-auto divide-y divide-slate-200 bg-white rounded-lg border border-slate-200 p-2 space-y-2">
                                  {recCompradores.map((c) => {
                                    if (!c) return null;
                                    const totalC = (Number(c.cantidad) || 0) * resumenFormUnidades.precio;
                                    const abonoC = c.estadoPago === 'PAGADO' ? totalC : c.estadoPago === 'INCOBRABLE' ? 0 : Math.min(totalC, Math.max(0, Number(c.montoAbonado) || 0));
                                    const saldoC = c.estadoPago === 'INCOBRABLE' ? 0 : Math.max(0, totalC - abonoC);

                                    return (
                                      <div key={c.id} className="p-2 bg-slate-50 rounded-lg border border-slate-200 space-y-2 text-xs">
                                        <div className="flex items-center justify-between gap-2">
                                          <input
                                            type="text"
                                            value={c.nombre || ''}
                                            onChange={(e) => handleModificarCompradorExistenteEnForm(c.id, 'nombre', e.target.value)}
                                            className="font-bold text-slate-800 bg-white border border-slate-300 rounded px-2 py-1 flex-1 text-xs"
                                            placeholder="Nombre..."
                                          />
                                          <button
                                            type="button"
                                            onClick={() => handleEliminarCompradorForm(c.id)}
                                            className="text-slate-400 hover:text-rose-600 p-1"
                                            title="Eliminar comprador"
                                          >
                                            <Trash2 className="w-4 h-4" />
                                          </button>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2">
                                          <div className="flex items-center gap-1">
                                            <span className="text-[10px] text-slate-500 font-bold">Unid:</span>
                                            <input
                                              type="number"
                                              min="1"
                                              value={c.cantidad || 1}
                                              onChange={(e) => handleModificarCompradorExistenteEnForm(c.id, 'cantidad', e.target.value)}
                                              className="w-16 bg-white border border-slate-300 rounded px-2 py-1 font-bold text-center text-xs"
                                            />
                                          </div>
                                          <div className="flex items-center justify-end gap-1">
                                            <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                                              c.estadoPago === 'PAGADO' ? 'bg-emerald-100 text-emerald-800' : c.estadoPago === 'INCOBRABLE' ? 'bg-amber-100 text-amber-900' : 'bg-rose-100 text-rose-800'
                                            }`}>
                                              {c.estadoPago === 'PAGADO' ? 'Pagado ✓' : c.estadoPago === 'INCOBRABLE' ? 'Incobrable ✕' : `Debe ${formatCOP(saldoC)}`}
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div>
                            <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Valor Total Recaudado ($)</label>
                            <input
                              type="number"
                              min="100"
                              step="100"
                              required
                              value={recMonto}
                              onChange={(e) => setRecMonto(e.target.value)}
                              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold text-slate-900 bg-white"
                            />
                          </div>
                        )}

                        <div>
                          <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Descripción / Detalle</label>
                          <input
                            type="text"
                            placeholder={modoRecaudo === 'UNIDADES' ? 'Opcional en modo unidades..' : 'Ej. Ofrenda especial culto...'}
                            value={recDescripcion}
                            onChange={(e) => setRecDescripcion(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Método de Recaudo</label>
                          <select
                            value={recMetodo}
                            onChange={(e) => setRecMetodo(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white font-medium"
                          >
                            <option value="Efectivo">Efectivo</option>
                            <option value="Transferencia / Nequi">Transferencia / Nequi</option>
                          </select>
                        </div>

                        <button
                          type="submit"
                          disabled={esMesCerrado(recFecha)}
                          className={`w-full py-3.5 rounded-xl text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 ${
                            esMesCerrado(recFecha) ? 'bg-slate-400 cursor-not-allowed' : editingRecaudoId ? 'bg-amber-600 hover:bg-amber-700' : 'bg-emerald-600 hover:bg-emerald-700'
                          }`}
                        >
                          <PlusCircle className="w-4 h-4" />
                          {editingRecaudoId ? 'Guardar Cambios del Recaudo' : 'Enviar Recaudo a Tesorería'}
                        </button>
                      </form>
                    </div>
                  </div>

                  <div className="lg:col-span-7 space-y-4">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                      <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                        <div>
                          <h2 className="text-base font-bold text-slate-900">Informe de Mis Recaudos y Estado de Cartera</h2>
                          <p className="text-xs text-slate-500">Supervisa tus unidades, abonos y deudores en tiempo real.</p>
                        </div>
                        <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-900 text-xs font-bold">
                          {(movimientos || []).filter((m) => m && m.tipo === 'INGRESO' && m.responsable === usuarioLogueadoRecaudador.nombre).length} actividades
                        </span>
                      </div>

                      <div className="space-y-4">
                        {(movimientos || []).filter((m) => m && m.tipo === 'INGRESO' && m.responsable === usuarioLogueadoRecaudador.nombre).length === 0 ? (
                          <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                            <p className="text-sm font-semibold text-slate-600">No hay recaudos registrados todavía por ti.</p>
                          </div>
                        ) : (
                          (movimientos || [])
                            .filter((m) => m && m.tipo === 'INGRESO' && m.responsable === usuarioLogueadoRecaudador.nombre)
                            .map((item) => {
                              if (!item) return null;
                              const inv = calcularResumenInventario(item);
                              const isExpanded = !!expandedRows[item.id];
                              const totalReportadoItem = Number(item.montoReportado || 0) + Number(item.ultimoAbonoReportado || 0);
                              const mesCerradoItem = esMesCerrado(item.fecha);

                              return (
                                <div key={item.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 shadow-xs space-y-3">
                                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                                    <div>
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-xs font-mono font-bold text-indigo-800 bg-indigo-100 px-2 py-0.5 rounded">
                                          {item.id}
                                        </span>
                                        <span className="font-bold text-slate-900 text-sm">{item.actividad}</span>
                                        <span className="text-xs text-slate-400">• {item.fecha}</span>
                                      </div>
                                      <p className="text-xs text-slate-600 mt-1 font-medium">{item.descripcion}</p>
                                    </div>

                                    <div className="flex sm:flex-col items-end justify-between gap-2 shrink-0">
                                      <div className="text-right">
                                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Recaudado Total:</span>
                                        <span className="text-lg font-extrabold text-slate-900">
                                          {formatCOP(totalReportadoItem)}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2 flex-wrap justify-end">
                                        {!mesCerradoItem && (
                                          item.edicionAutorizada ? (
                                            <button
                                              type="button"
                                              onClick={() => handleIniciarEdicion(item)}
                                              className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-600 text-white animate-pulse"
                                            >
                                              Editar (Autorizado)
                                            </button>
                                          ) : item.solicitudEdicion ? (
                                            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                                              Esperando Permiso
                                            </span>
                                          ) : (
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setSolicitudEdicionModal(item);
                                                setMotivoSolicitudEdicion('');
                                              }}
                                              className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300 hover:bg-slate-200"
                                            >
                                              Solicitar Edición
                                            </button>
                                          )
                                        )}
                                        {renderEstadoBadge(item)}
                                      </div>
                                    </div>
                                  </div>

                                  {item.notaTesorero && (
                                    <div className="bg-indigo-50/80 border border-indigo-100 p-2.5 rounded-xl text-xs text-indigo-950 flex items-start gap-2">
                                      <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                                      <div>
                                        <strong className="font-bold">Mensaje de Tesorería / Devolución:</strong> {item.notaTesorero}
                                      </div>
                                    </div>
                                  )}

                                  {inv.esUnidades && (
                                    <div className="pt-2 border-t border-slate-200 space-y-2.5">
                                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                                        <div className="bg-white px-2.5 py-2 rounded-xl border border-slate-200">
                                          <span className="text-slate-400 block text-[10px]">Producidas</span>
                                          <span className="font-bold text-slate-800">{inv.producidas} × {formatCOP(inv.precioUnitario)}</span>
                                        </div>
                                        <div className="bg-emerald-50 px-2.5 py-2 rounded-xl border border-emerald-200">
                                          <span className="text-emerald-700 block text-[10px]">Recaudado ({inv.unidadesPagadas} pag.)</span>
                                          <span className="font-extrabold text-emerald-900">{formatCOP(inv.plataPagada)}</span>
                                        </div>
                                        <div className="bg-rose-50 px-2.5 py-2 rounded-xl border border-rose-200">
                                          <span className="text-rose-700 block text-[10px]">Fiados ({inv.unidadesFiadas} unid.)</span>
                                          <span className="font-extrabold text-rose-900">{formatCOP(inv.plataFiada)}</span>
                                        </div>
                                        <div className="bg-amber-50 px-2.5 py-2 rounded-xl border border-amber-200">
                                          <span className="text-amber-800 block text-[10px]">Incobrables ({inv.unidadesIncobrables})</span>
                                          <span className="font-extrabold text-amber-950">{formatCOP(inv.plataIncobrable)}</span>
                                        </div>
                                      </div>

                                      {Array.isArray(item.compradores) && item.compradores.length > 0 && (
                                        <div>
                                          <button
                                            type="button"
                                            onClick={() => toggleExpandRow(item.id)}
                                            className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-800 hover:text-indigo-950 pt-1"
                                          >
                                            <Users className="w-3.5 h-3.5" />
                                            {isExpanded ? 'Ocultar lista de compradores y deudores' : `Ver informe de compradores y deudores (${item.compradores.length})`}
                                          </button>

                                          {isExpanded && (
                                            <div className="mt-2 bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 p-2 space-y-2">
                                              {item.compradores.map((c) => {
                                                if (!c) return null;
                                                const totalComp = (Number(c.cantidad) || 0) * inv.precioUnitario;
                                                const abonoActual = c.estadoPago === 'PAGADO' ? totalComp : c.estadoPago === 'INCOBRABLE' ? 0 : Math.min(totalComp, Math.max(0, Number(c.montoAbonado) || 0));
                                                const saldoPendiente = c.estadoPago === 'INCOBRABLE' ? 0 : Math.max(0, totalComp - abonoActual);

                                                return (
                                                  <div key={c.id} className="p-2 flex items-center justify-between gap-2 text-xs rounded-lg hover:bg-slate-50">
                                                    <div>
                                                      <span className="font-bold text-slate-800">{c.nombre}</span>
                                                      <span className="text-slate-500 ml-1">• {c.cantidad} unid. ({formatCOP(totalComp)})</span>
                                                      {c.estadoPago === 'INCOBRABLE' ? (
                                                        <span className="block text-[11px] text-amber-800 font-bold">
                                                          [Dado de baja como Incobrable / Condonado]
                                                        </span>
                                                      ) : c.solicitudIncobrable ? (
                                                        <span className="block text-[11px] text-amber-600 font-bold">
                                                          [Esperando aprobación de Tesorería para Incobrable]
                                                        </span>
                                                      ) : saldoPendiente > 0 && (
                                                        <span className="block text-[11px] text-rose-700 font-bold">
                                                          Abonado: {formatCOP(abonoActual)} | Debe: {formatCOP(saldoPendiente)}
                                                        </span>
                                                      )}
                                                    </div>
                                                    <div className="flex items-center gap-2 flex-wrap justify-end">
                                                      {!mesCerradoItem && c.estadoPago !== 'INCOBRABLE' && !c.solicitudIncobrable && saldoPendiente > 0 && (
                                                        <>
                                                          <button
                                                            type="button"
                                                            onClick={() => openAbonoModal(item, c)}
                                                            className="px-2.5 py-1 rounded-lg bg-indigo-950 text-white text-[11px] font-bold hover:bg-indigo-900 shadow-xs"
                                                          >
                                                            Abonar
                                                          </button>
                                                          <button
                                                            type="button"
                                                            onClick={() => handleSaldarTodoComprador(item.id, c.id)}
                                                            className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-[11px] font-bold hover:bg-emerald-700 shadow-xs"
                                                          >
                                                            Saldar Todo
                                                          </button>
                                                          <button
                                                            type="button"
                                                            onClick={() => {
                                                              setSolicitudIncobrableModal({ movimientoId: item.id, compradorId: c.id });
                                                              setMotivoIncobrableInput('');
                                                            }}
                                                            className="px-2 py-1 rounded-lg bg-amber-100 text-amber-900 text-[10px] font-bold hover:bg-amber-200"
                                                            title="Solicitar a tesorería dar de baja"
                                                          >
                                                            Solicitar Incobrable
                                                          </button>
                                                        </>
                                                      )}
                                                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                                        c.estadoPago === 'PAGADO' ? 'bg-emerald-100 text-emerald-800' : c.estadoPago === 'INCOBRABLE' ? 'bg-amber-100 text-amber-900' : c.solicitudIncobrable ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-rose-100 text-rose-800'
                                                      }`}>
                                                        {c.estadoPago === 'PAGADO' ? 'Pagado ✓' : c.estadoPago === 'INCOBRABLE' ? 'Incobrable ✕' : c.solicitudIncobrable ? 'Solicitud Enviada' : 'Fiado'}
                                                      </span>
                                                    </div>
                                                  </div>
                                                );
                                              })}
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {activeRole === 'TESORERO' && (
          <>
            {!usuarioLogueadoTesorero ? (
              <div className="max-w-md mx-auto mt-16 bg-white rounded-2xl shadow-xl border border-slate-200 p-8 text-center">
                <div className="w-14 h-14 bg-indigo-100 text-indigo-900 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Ingreso Tesorería Central</h2>
                <p className="text-sm text-slate-500 mt-1">Ingresa tu usuario y clave de tesorero.</p>

                <form onSubmit={handleTesoreroLogin} className="mt-6 space-y-4 text-left">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Usuario</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. tesorero"
                      value={tesUserLoginInput}
                      onChange={(e) => setTesUserLoginInput(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white outline-none focus:ring-2 focus:ring-indigo-600 font-medium"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Contraseña / Clave</label>
                    <input
                      type="password"
                      required
                      placeholder="••••"
                      value={tesPassLoginInput}
                      onChange={(e) => setTesPassLoginInput(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white outline-none focus:ring-2 focus:ring-indigo-600 font-medium"
                    />
                  </div>
                  {tesLoginError && (
                    <p className="text-xs text-rose-600 font-semibold">{tesLoginError}</p>
                  )}

                  <div className="flex items-center justify-between text-xs pt-1">
                    <button
                      type="button"
                      onClick={() => setShowOlvidoClaveModal(true)}
                      className="text-indigo-700 hover:underline font-bold flex items-center gap-1"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      ¿Se te olvidó tu clave?
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowRestablecerClaveModal(true)}
                      className="text-emerald-700 hover:underline font-bold flex items-center gap-1"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      Tengo autorización
                    </button>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-indigo-950 hover:bg-indigo-900 text-white font-bold text-sm shadow-md transition-all mt-2"
                  >
                    Ingresar a Tesorería
                  </button>
                </form>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-sm font-bold text-slate-800">
                      Tesorero Conectado: <span className="text-indigo-900 underline">{usuarioLogueadoTesorero.nombre}</span>
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => setShowCambioClaveTesoreroModal(true)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-900 text-xs font-bold transition-all"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      Cambiar mi Clave
                    </button>
                    <button
                      onClick={handleExportCSV}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Descargar Excel
                    </button>
                    <button
                      onClick={() => setUsuarioLogueadoTesorero(null)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition-all"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      Cerrar Sesión
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-start">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Entradas</span>
                      <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                    </div>
                    <p className="text-lg font-extrabold text-slate-900 mt-2">{formatCOP(kpis.totalEntradasVerificadas)}</p>
                    <span className="text-[10px] text-emerald-700 font-semibold mt-1 block">Dinero contado en caja</span>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-start">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Salidas Netas</span>
                      <ArrowDownRight className="w-4 h-4 text-rose-600" />
                    </div>
                    <p className="text-lg font-extrabold text-rose-600 mt-2">- {formatCOP(kpis.totalSalidas)}</p>
                    <span className="text-[10px] text-slate-500 font-semibold mt-1 block">Gastos menos sobrantes devueltos</span>
                  </div>

                  <div className="bg-indigo-950 p-4 rounded-2xl shadow-md text-white">
                    <div className="flex justify-between items-start">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-200">Saldo en Caja</span>
                      <Wallet className="w-4 h-4 text-emerald-400" />
                    </div>
                    <p className="text-xl font-extrabold text-emerald-400 mt-2">{formatCOP(kpis.saldoRealEnCaja)}</p>
                    <span className="text-[10px] text-indigo-200 font-semibold mt-1 block">Entradas - Salidas</span>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-sm">
                    <div className="flex justify-between items-start">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">Pendiente Recoger</span>
                      <Clock className="w-4 h-4 text-amber-600" />
                    </div>
                    <p className="text-lg font-extrabold text-amber-700 mt-2">{formatCOP(kpis.pendientePorRecoger)}</p>
                    <span className="text-[10px] text-amber-800 font-semibold mt-1 block">{kpis.cantidadPendientes} entrega(s) por recibir</span>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-indigo-200 shadow-sm">
                    <div className="flex justify-between items-start">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-900">Cartera / En Calle</span>
                      <ShoppingBag className="w-4 h-4 text-indigo-600" />
                    </div>
                    <p className="text-lg font-extrabold text-indigo-900 mt-2">{formatCOP(kpis.totalCarteraYSinVender)}</p>
                    <span className="text-[10px] text-indigo-800 font-semibold mt-1 block">Fiados y sin vender</span>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-rose-200 shadow-sm">
                    <div className="flex justify-between items-start">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-rose-800">Descuadre Revisión</span>
                      <AlertTriangle className="w-4 h-4 text-rose-600" />
                    </div>
                    <p className="text-lg font-extrabold text-rose-700 mt-2">{formatCOP(kpis.descuadreAcumulado)}</p>
                    <span className="text-[10px] text-rose-800 font-semibold mt-1 block">{kpis.cantidadDescuadres} novedad(es) en arqueo</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
                  <button
                    onClick={() => setTesoreroTab('BANDEJA')}
                    className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                      tesoreroTab === 'BANDEJA' ? 'bg-indigo-950 text-white shadow-xs' : 'bg-white text-slate-600 border hover:bg-slate-50'
                    }`}
                  >
                    <Calculator className="w-4 h-4" />
                    <span>Recepción, Arqueo y Permisos</span>
                    {(kpis.cantidadPendientes + kpis.cantidadDescuadres + kpis.cantidadSolicitudesIncobrable) > 0 && (
                      <span className="px-1.5 py-0.5 text-xs rounded-full bg-amber-400 text-indigo-950 font-extrabold">
                        {kpis.cantidadPendientes + kpis.cantidadDescuadres + kpis.cantidadSolicitudesIncobrable}
                      </span>
                    )}
                  </button>

                  <button
                    onClick={() => setTesoreroTab('EGRESOS')}
                    className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                      tesoreroTab === 'EGRESOS' ? 'bg-indigo-950 text-white shadow-xs' : 'bg-white text-slate-600 border hover:bg-slate-50'
                    }`}
                  >
                    <TrendingDown className="w-4 h-4 text-rose-400" />
                    <span>Registrar Salida / Gasto</span>
                  </button>

                  <button
                    onClick={() => setTesoreroTab('LIBRO')}
                    className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                      tesoreroTab === 'LIBRO' ? 'bg-indigo-950 text-white shadow-xs' : 'bg-white text-slate-600 border hover:bg-slate-50'
                    }`}
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                    <span>Libro Único Completo ({(movimientos || []).length})</span>
                  </button>
                </div>

                {tesoreroTab === 'BANDEJA' && (
                  <div className="space-y-6">
                    {kpis.cantidadSolicitudesIncobrable > 0 && (
                      <div className="bg-amber-50 rounded-2xl border-2 border-amber-300 p-5 shadow-sm">
                        <h3 className="font-bold text-amber-950 text-sm mb-3 flex items-center gap-2">
                          <ShoppingBag className="w-4 h-4 text-amber-800" />
                          Solicitudes de Deudas Incobrables (Dar de Baja)
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {(movimientos || [])
                            .filter((m) => m && m.modoRegistro === 'UNIDADES' && Array.isArray(m.compradores) && m.compradores.some((c) => c && c.solicitudIncobrable))
                            .flatMap((item) => {
                              const precio = Number(item.precioUnitario) || 0;
                              const mesCerradoItem = esMesCerrado(item.fecha);
                              return (item.compradores || [])
                                .filter((c) => c && c.solicitudIncobrable)
                                .map((c) => {
                                  const totalC = (Number(c.cantidad) || 0) * precio;
                                  return (
                                    <div key={`${item.id}-${c.id}`} className="bg-white p-4 rounded-xl border border-amber-300 shadow-xs flex flex-col justify-between gap-3">
                                      <div>
                                        <div className="flex items-center justify-between">
                                          <span className="text-xs font-mono font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded">{item.id}</span>
                                          <span className="text-xs font-semibold text-slate-500">{item.actividad}</span>
                                        </div>
                                        <h4 className="font-bold text-slate-900 text-sm mt-1">Deudor: {c.nombre} ({c.cantidad} unid. • {formatCOP(totalC)})</h4>
                                        <p className="text-xs text-amber-900 bg-amber-50 p-2.5 rounded-lg border border-amber-200 mt-2">
                                          <strong>Motivo:</strong> "{c.motivoIncobrable}"
                                        </p>
                                      </div>
                                      {!mesCerradoItem ? (
                                        <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                                          <button
                                            type="button"
                                            onClick={() => handleTesoreroResolverIncobrable(item.id, c.id, true)}
                                            className="flex-1 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs"
                                          >
                                            Aprobar como Incobrable ✕
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => handleTesoreroResolverIncobrable(item.id, c.id, false)}
                                            className="py-2 px-3 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs"
                                          >
                                            Rechazar
                                          </button>
                                        </div>
                                      ) : (
                                        <span className="text-xs font-bold text-rose-700 bg-rose-50 p-2 rounded text-center">
                                          Mes cerrado por el Pastor. No modificable.
                                        </span>
                                      )}
                                    </div>
                                  );
                                });
                            })}
                        </div>
                      </div>
                    )}

                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                      <h3 className="font-bold text-base text-slate-900 mb-1">Bandeja de Entrada de Recaudos y Solicitudes de Edición</h3>
                      <p className="text-xs text-slate-500 mb-4">Recibe el dinero en efectivo o transferencia, audita arqueos y autoriza correcciones si es necesario.</p>

                      <div className="space-y-4">
                        {(movimientos || []).filter((m) => m && m.tipo === 'INGRESO').length === 0 ? (
                          <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                            <p className="text-sm font-semibold text-slate-600">No hay recaudos enviados por los recaudadores todavía.</p>
                          </div>
                        ) : (
                          (movimientos || [])
                            .filter((m) => m && m.tipo === 'INGRESO')
                            .map((item) => {
                              if (!item) return null;
                              const inv = calcularResumenInventario(item);
                              const abonoOpendienteARecibir = Number(item.ultimoAbonoReportado) > 0 ? Number(item.ultimoAbonoReportado) : Number(item.montoReportado || 0);
                              const mesCerradoItem = esMesCerrado(item.fecha);

                              return (
                                <div key={item.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 shadow-xs space-y-3">
                                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                                    <div>
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-xs font-mono font-bold text-indigo-800 bg-indigo-100 px-2 py-0.5 rounded">
                                          {item.id}
                                        </span>
                                        <span className="font-bold text-slate-900 text-sm">{item.actividad}</span>
                                        <span className="text-xs text-slate-400">• {item.fecha}</span>
                                        <span className="text-xs font-semibold text-indigo-900 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                                          Recaudador: {item.responsable}
                                        </span>
                                      </div>
                                      <p className="text-xs text-slate-600 mt-1">{item.descripcion}</p>
                                    </div>

                                    <div className="flex sm:flex-col items-end justify-between gap-2 shrink-0">
                                      <div className="text-right">
                                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Reportado en Total:</span>
                                        <span className="text-lg font-extrabold text-slate-900">
                                          {formatCOP(item.montoReportado)}
                                        </span>
                                        {Number(item.montoRecibido) > 0 && (
                                          <span className="block text-[11px] text-emerald-700 font-bold">
                                            Ya recibido en caja: {formatCOP(item.montoRecibido)}
                                          </span>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-2 flex-wrap justify-end">
                                        {!mesCerradoItem && item.solicitudEdicion && !item.edicionAutorizada && (
                                          <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-xl text-xs">
                                            <span className="font-bold text-amber-900">Pide Editar: "{item.motivoEdicion}"</span>
                                            <button
                                              onClick={() => handleAutorizarEdicionTesorero(item, true)}
                                              className="ml-2 px-2 py-0.5 bg-emerald-600 text-white rounded font-bold hover:bg-emerald-700"
                                            >
                                              Aprobar
                                            </button>
                                            <button
                                              onClick={() => handleAutorizarEdicionTesorero(item, false)}
                                              className="px-2 py-0.5 bg-rose-600 text-white rounded font-bold hover:bg-rose-700"
                                            >
                                              Rechazar
                                            </button>
                                          </div>
                                        )}
                                        {renderEstadoBadge(item)}
                                      </div>
                                    </div>
                                  </div>

                                  {item.notaTesorero && (
                                    <div className="bg-indigo-50 border border-indigo-100 p-2.5 rounded-xl text-xs text-indigo-950 flex items-start gap-2">
                                      <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                                      <div>
                                        <strong className="font-bold">Nota / Historial:</strong> {item.notaTesorero}
                                      </div>
                                    </div>
                                  )}

                                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200">
                                    <div className="text-xs text-slate-600">
                                      {inv.esUnidades ? (
                                        <span>
                                          Unidades producidas: <strong>{inv.producidas}</strong> | En mano: <strong>{formatCOP(inv.plataPagada)}</strong> | Cartera: <strong>{formatCOP(inv.plataFiada)}</strong>
                                        </span>
                                      ) : (
                                        <span>Método de pago: <strong>{item.metodoPago || 'Efectivo'}</strong></span>
                                      )}
                                    </div>

                                    <div className="flex items-center gap-2 flex-wrap">
                                      {!mesCerradoItem ? (
                                        <>
                                          {item.estado === 'PENDIENTE' && (
                                            <>
                                              <button
                                                type="button"
                                                onClick={() => openArqueoModal(item)}
                                                className="px-3.5 py-2 rounded-xl bg-indigo-950 hover:bg-indigo-900 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5"
                                              >
                                                <Calculator className="w-3.5 h-3.5 text-emerald-400" />
                                                Recibir y Arqueo ({formatCOP(abonoOpendienteARecibir)})
                                              </button>
                                              <button
                                                type="button"
                                                onClick={() => handleCerrarRecaudoSinMasNovedad(item)}
                                                className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all"
                                              >
                                                Recibir Conforme ✓
                                              </button>
                                            </>
                                          )}
                                          {item.estado === 'DESCUADRE' && (
                                            <button
                                              type="button"
                                              onClick={() => handleAprobarAjusteDescuadre(item)}
                                              className="px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs font-bold shadow-xs transition-all"
                                            >
                                              Aprobar Ajuste y Cerrar
                                            </button>
                                          )}
                                        </>
                                      ) : (
                                        <span className="text-xs font-bold text-rose-700 bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-200">
                                          Mes cerrado por el Pastor. Bloqueado.
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {tesoreroTab === 'EGRESOS' && (
                  <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                    <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
                      <div className="p-3 bg-rose-50 text-rose-700 rounded-xl">
                        <TrendingDown className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-900">Registrar Salida de Caja / Egreso</h3>
                        <p className="text-xs text-slate-500">Registra compras, servicios públicos, ayudas o gastos con opción de registrar sobrante devuelto.</p>
                      </div>
                    </div>

                    {esMesCerrado(egrFecha) && (
                      <div className="mb-4 bg-rose-50 border border-rose-200 p-3 rounded-xl text-xs text-rose-800 font-bold flex items-center gap-2">
                        <Lock className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>Este mes ya está cerrado oficialmente por el Pastor. No se pueden registrar egresos aquí.</span>
                      </div>
                    )}

                    <form onSubmit={handleRegistrarEgreso} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Fecha</label>
                          <input
                            type="date"
                            required
                            value={egrFecha}
                            onChange={(e) => setEgrFecha(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Categoría del Gasto</label>
                          <select
                            value={egrCategoria}
                            onChange={(e) => setEgrCategoria(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white font-medium"
                          >
                            {CATEGORIAS_EGRESO.map((cat) => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Concepto / Descripción del Egreso</label>
                        <input
                          type="text"
                          required
                          placeholder="Ej. Compra de mercado para ayuda social, reparación de tubería..."
                          value={egrConcepto}
                          onChange={(e) => setEgrConcepto(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Responsable / A quien se entrega</label>
                          <input
                            type="text"
                            required
                            placeholder="Ej. Hno. Pedro Pérez"
                            value={egrResponsable}
                            onChange={(e) => setEgrResponsable(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Valor Total Entregado ($)</label>
                          <input
                            type="number"
                            min="100"
                            step="100"
                            required
                            placeholder="Ej. 150000"
                            value={egrMonto}
                            onChange={(e) => setEgrMonto(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold text-slate-900 bg-white"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Sobrante Devuelto a Caja ($) (Opcional)</label>
                        <input
                          type="number"
                          min="0"
                          step="100"
                          placeholder="Si sobró dinero y lo regresaron, pon el valor aquí..."
                          value={egrSobranteDevuelto}
                          onChange={(e) => setEgrSobranteDevuelto(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold text-emerald-700 bg-emerald-50/50"
                        />
                        <span className="text-[11px] text-slate-500 mt-1 block">Este valor se restará del gasto total y regresará automáticamente al saldo de caja.</span>
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Observaciones / Factura</label>
                        <input
                          type="text"
                          placeholder="Número de factura o nota..."
                          value={egrNota}
                          onChange={(e) => setEgrNota(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={esMesCerrado(egrFecha)}
                        className={`w-full py-3.5 rounded-xl text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 mt-4 ${
                          esMesCerrado(egrFecha) ? 'bg-slate-400 cursor-not-allowed' : 'bg-rose-600 hover:bg-rose-700'
                        }`}
                      >
                        <TrendingDown className="w-4 h-4" />
                        Registrar Egreso y Actualizar Caja
                      </button>
                    </form>
                  </div>
                )}

                {tesoreroTab === 'LIBRO' && (
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <h3 className="text-base font-bold text-slate-900">Libro Único de Tesorería</h3>
                        <p className="text-xs text-slate-500">Historial completo e inalterable de ingresos, egresos y arqueos de la iglesia.</p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <div className="relative">
                          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                          <input
                            type="text"
                            placeholder="Buscar en el libro..."
                            value={busquedaLibro}
                            onChange={(e) => setBusquedaLibro(e.target.value)}
                            className="pl-9 pr-4 py-2 rounded-xl border border-slate-300 text-xs bg-white w-full sm:w-56"
                          />
                        </div>
                        <select
                          value={filtroLibro}
                          onChange={(e) => setFiltroLibro(e.target.value)}
                          className="px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white font-semibold"
                        >
                          <option value="TODOS">Todos los movimientos</option>
                          <option value="INGRESOS">Solo Ingresos</option>
                          <option value="EGRESOS">Solo Egresos</option>
                          <option value="VERIFICADO">Verificados</option>
                          <option value="PENDIENTE">Pendientes</option>
                        </select>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200 bg-slate-100 text-[11px] font-bold uppercase text-slate-600">
                            <th className="p-3">ID / Fecha</th>
                            <th className="p-3">Tipo / Actividad</th>
                            <th className="p-3">Descripción</th>
                            <th className="p-3">Responsable</th>
                            <th className="p-3 text-right">Entrada / Salida</th>
                            <th className="p-3 text-center">Estado</th>
                            <th className="p-3 text-center">Acciones</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs">
                          {movimientosFiltrados.length === 0 ? (
                            <tr>
                              <td colSpan="7" className="text-center py-12 text-slate-500">
                                No se encontraron registros con los filtros seleccionados.
                              </td>
                            </tr>
                          ) : (
                            movimientosFiltrados.map((m) => {
                              if (!m) return null;
                              const esIngreso = m.tipo === 'INGRESO';
                              const montoMostrar = esIngreso ? Number(m.montoRecibido) || Number(m.montoReportado) : (Number(m.montoSalida) || 0) - (Number(m.montoSobranteDevuelto) || 0);
                              const mesCerradoItem = esMesCerrado(m.fecha);

                              return (
                                <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                                  <td className="p-3 whitespace-nowrap">
                                    <span className="font-mono font-bold text-indigo-800">{m.id}</span>
                                    <span className="block text-[10px] text-slate-400">{m.fecha}</span>
                                  </td>
                                  <td className="p-3">
                                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold mb-0.5 ${esIngreso ? 'bg-indigo-100 text-indigo-900' : 'bg-rose-100 text-rose-900'}`}>
                                      {m.tipo}
                                    </span>
                                    <span className="block font-bold text-slate-800">{m.actividad}</span>
                                  </td>
                                  <td className="p-3 text-slate-600 max-w-xs truncate" title={m.descripcion}>
                                    {m.descripcion}
                                    {m.montoSobranteDevuelto > 0 && (
                                      <span className="block text-[10px] text-emerald-700 font-bold">
                                        Devuelto a caja: {formatCOP(m.montoSobranteDevuelto)}
                                      </span>
                                    )}
                                    {m.notaTesorero && <span className="block text-[10px] text-indigo-700 italic">Nota: {m.notaTesorero}</span>}
                                  </td>
                                  <td className="p-3 text-slate-700 font-medium">{m.responsable}</td>
                                  <td className="p-3 text-right font-extrabold whitespace-nowrap">
                                    {esIngreso ? (
                                      <span className="text-emerald-700">+{formatCOP(montoMostrar)}</span>
                                    ) : (
                                      <span className="text-rose-600">-{formatCOP(montoMostrar)}</span>
                                    )}
                                  </td>
                                  <td className="p-3 text-center whitespace-nowrap">
                                    {renderEstadoBadge(m)}
                                  </td>
                                  <td className="p-3 text-center whitespace-nowrap">
                                    <div className="flex items-center justify-center gap-1.5">
                                      {mesCerradoItem ? (
                                        <span className="text-[10px] font-bold text-slate-400">Mes Bloqueado</span>
                                      ) : m.solicitudBorrado ? (
                                        <span className="px-2 py-1 bg-amber-100 text-amber-900 text-[10px] font-bold rounded">
                                          Esperando Pastor
                                        </span>
                                      ) : m.borradoAutorizado ? (
                                        <button
                                          type="button"
                                          onClick={() => setEliminarItemModal(m)}
                                          className="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] shadow-xs"
                                          title="Pastor autorizó borrar"
                                        >
                                          Eliminar (Autorizado)
                                        </button>
                                      ) : (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setSolicitudBorradoModal(m);
                                            setMotivoBorradoInput('');
                                          }}
                                          className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[10px] border border-slate-300"
                                          title="Solicitar permiso al Pastor para borrar"
                                        >
                                          Solicitar Borrado
                                        </button>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {activeRole === 'ADMINISTRADOR' && (
          <>
            {!usuarioLogueadoAdmin ? (
              <div className="max-w-md mx-auto mt-16 bg-white rounded-2xl shadow-xl border border-slate-200 p-8 text-center">
                <div className="w-14 h-14 bg-amber-100 text-amber-900 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
                  <ShieldAlert className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Panel Exclusivo Pastor / Administrador</h2>
                <p className="text-sm text-slate-500 mt-1">Acceso restringido para auditoría, cierres de mes y permisos de borrado.</p>

                <form onSubmit={handleAdminLogin} className="mt-6 space-y-4 text-left">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Usuario Administrador</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. admin"
                      value={adminUserLoginInput}
                      onChange={(e) => setAdminUserLoginInput(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Contraseña</label>
                    <input
                      type="password"
                      required
                      placeholder="••••"
                      value={adminPassLoginInput}
                      onChange={(e) => setAdminPassLoginInput(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                    />
                  </div>
                  {adminLoginError && (
                    <p className="text-xs text-rose-600 font-semibold">{adminLoginError}</p>
                  )}

                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-indigo-950 hover:bg-indigo-900 text-white font-bold text-sm shadow-md transition-all mt-2"
                  >
                    Entrar como Pastor / Admin
                  </button>
                </form>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-indigo-950 text-white p-4 rounded-2xl border border-indigo-900 shadow-md">
                  <div className="flex items-center gap-2.5">
                    <span className="w-3 h-3 rounded-full bg-amber-400 animate-ping"></span>
                    <span className="text-sm font-bold">
                      Sesión Pastor / Administrador Activa: <span className="text-amber-300 underline">{usuarioLogueadoAdmin.nombre}</span>
                    </span>
                  </div>
                  <button
                    onClick={() => setUsuarioLogueadoAdmin(null)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-all"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    Cerrar Sesión Admin
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-center">
                    <span className="text-[11px] font-bold uppercase text-slate-500 block">Saldo Real en Caja</span>
                    <span className="text-xl font-extrabold text-indigo-900 mt-1 block">{formatCOP(kpis.saldoRealEnCaja)}</span>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-center">
                    <span className="text-[11px] font-bold uppercase text-slate-500 block">Total Entradas</span>
                    <span className="text-xl font-extrabold text-emerald-700 mt-1 block">{formatCOP(kpis.totalEntradasVerificadas)}</span>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-center">
                    <span className="text-[11px] font-bold uppercase text-slate-500 block">Total Salidas Netas</span>
                    <span className="text-xl font-extrabold text-rose-600 mt-1 block">{formatCOP(kpis.totalSalidas)}</span>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-center">
                    <span className="text-[11px] font-bold uppercase text-slate-500 block">Cierres Realizados</span>
                    <span className="text-xl font-extrabold text-indigo-950 mt-1 block">{(cierresMensuales || []).length} meses</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
                  <button
                    onClick={() => setAdminTab('AUDITORIA')}
                    className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                      adminTab === 'AUDITORIA' ? 'bg-indigo-950 text-white shadow-xs' : 'bg-white text-slate-600 border hover:bg-slate-50'
                    }`}
                  >
                    <Calculator className="w-4 h-4 text-amber-400" />
                    <span>Auditoría & Cierre de Mes (Pastor)</span>
                  </button>

                  <button
                    onClick={() => setAdminTab('BORRADOS')}
                    className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                      adminTab === 'BORRADOS' ? 'bg-indigo-950 text-white shadow-xs' : 'bg-white text-slate-600 border hover:bg-slate-50'
                    }`}
                  >
                    <Trash2 className="w-4 h-4 text-rose-400" />
                    <span>Permisos de Borrado Libro Único</span>
                    {kpis.cantidadSolicitudesBorrado > 0 && (
                      <span className="px-1.5 py-0.5 text-xs rounded-full bg-rose-600 text-white font-extrabold animate-pulse">
                        {kpis.cantidadSolicitudesBorrado}
                      </span>
                    )}
                  </button>

                  <button
                    onClick={() => setAdminTab('USUARIOS')}
                    className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                      adminTab === 'USUARIOS' ? 'bg-indigo-950 text-white shadow-xs' : 'bg-white text-slate-600 border hover:bg-slate-50'
                    }`}
                  >
                    <Users className="w-4 h-4 text-emerald-400" />
                    <span>Gestión de Usuarios y Claves</span>
                    {(usuariosSistema || []).some(u => u && u.solicitudClave) && (
                      <span className="px-1.5 py-0.5 text-xs rounded-full bg-amber-400 text-indigo-950 font-extrabold">
                        1
                      </span>
                    )}
                  </button>
                </div>

                {adminTab === 'AUDITORIA' && (
                  <div className="space-y-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                      <div className="max-w-xl mx-auto space-y-6 text-center">
                        <div className="w-16 h-16 bg-amber-100 text-amber-900 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                          <Calendar className="w-8 h-8" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-slate-900">Ejecutar Cierre de Mes Oficial (Pastor)</h3>
                          <p className="text-sm text-slate-500 mt-1">
                            Selecciona el mes a cerrar. Al cerrarlo, el sistema bloqueará automáticamente todas las modificaciones de ese período a menos que el Pastor lo vuelva a abrir.
                          </p>
                        </div>

                        <form onSubmit={handleEjecutarCierreDeMes} className="space-y-4 pt-2">
                          <div className="flex items-center justify-center gap-3">
                            <label className="text-xs font-bold uppercase text-slate-700">Mes a Cerrar (AAAA-MM):</label>
                            <input
                              type="month"
                              required
                              value={mesCierreInput}
                              onChange={(e) => setMesCierreInput(e.target.value)}
                              className="px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-extrabold bg-white"
                            />
                          </div>

                          <button
                            type="submit"
                            className="w-full py-3.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm shadow-md transition-all"
                          >
                            Generar Auditoría y Sellar Cierre de Mes Oficial
                          </button>
                        </form>
                      </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
                      <h3 className="text-base font-bold text-slate-900">Historial de Cierres Mensuales y Actas Pastorales</h3>
                      <div className="space-y-4">
                        {(cierresMensuales || []).length === 0 ? (
                          <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                            <p className="text-sm text-slate-500 font-semibold">No hay cierres mensuales ejecutados todavía.</p>
                          </div>
                        ) : (
                          (cierresMensuales || []).map((c) => {
                            if (!c) return null;
                            return (
                              <div key={c.id} className="p-6 rounded-2xl border-2 border-indigo-950 bg-white shadow-md space-y-4 acta-imprimible-container">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
                                  <div>
                                    <span className="text-xs font-mono font-bold bg-indigo-900 text-white px-2.5 py-1 rounded-md">
                                      ACTA OFICIAL DE CIERRE MENSUAL: {c.mes} (CERRADO Y BLOQUEADO)
                                    </span>
                                    <h4 className="font-extrabold text-slate-900 text-base mt-2">Iglesia - Informe Oficial de Tesorería</h4>
                                  </div>
                                  <div className="text-right text-xs text-slate-500">
                                    <span>Fecha de corte: <strong>{c.fechaCierre}</strong></span>
                                    <span className="block">Auditor Pastor: <strong>{c.responsableCierre}</strong></span>
                                  </div>
                                </div>

                                <div className="text-sm text-slate-700 leading-relaxed italic bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                                  "En el mes de <strong>{c.mes}</strong>, bajo la dirección del Señor y la supervisión pastoral, la tesorería de la iglesia ha mantenido cuentas claras, transparentes y fieles. Se han auditado un total de {c.cantidadMovimientos} movimientos, registrando ingresos verificados por <strong>{formatCOP(c.totalEntradas)}</strong> y salidas netas por <strong>{formatCOP(c.totalSalidas)}</strong>, dejando un balance neto de <strong>{formatCOP(c.balanceNeto)}</strong> para la obra y la gloria de Dios. Concluimos este período con un saldo real en caja de <strong>{formatCOP(c.saldoCajaFinal)}</strong>."
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
                                  <div>
                                    <span className="text-slate-400 block">Total Entradas</span>
                                    <span className="font-extrabold text-emerald-700 text-sm">{formatCOP(c.totalEntradas)}</span>
                                  </div>
                                  <div>
                                    <span className="text-slate-400 block">Total Salidas</span>
                                    <span className="font-extrabold text-rose-600 text-sm">{formatCOP(c.totalSalidas)}</span>
                                  </div>
                                  <div>
                                    <span className="text-slate-400 block">Balance Neto</span>
                                    <span className="font-extrabold text-indigo-900 text-sm">{formatCOP(c.balanceNeto)}</span>
                                  </div>
                                  <div>
                                    <span className="text-slate-400 block">Saldo Final Caja</span>
                                    <span className="font-extrabold text-indigo-950 text-sm">{formatCOP(c.saldoCajaFinal)}</span>
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-6 mt-6 border-t border-slate-200 text-center">
                                  <div className="space-y-2">
                                    <div className="h-12 border-b-2 border-slate-400 w-48 mx-auto"></div>
                                    <p className="font-bold text-xs text-slate-800">Firma del Pastor / Administrador</p>
                                    <p className="text-[11px] text-slate-500">{c.responsableCierre}</p>
                                  </div>
                                  <div className="space-y-2">
                                    <div className="h-12 border-b-2 border-slate-400 w-48 mx-auto"></div>
                                    <p className="font-bold text-xs text-slate-800">Firma de Tesorería</p>
                                    <p className="text-[11px] text-slate-500">Tesorero(a) Principal</p>
                                  </div>
                                </div>

                                <div className="flex items-center justify-between pt-2 no-print">
                                  <button
                                    type="button"
                                    onClick={() => handleReabrirMesPastor(c.mes)}
                                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs"
                                  >
                                    <Unlock className="w-3.5 h-3.5" />
                                    Reabrir Mes (Permitir Cambios)
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => window.print()}
                                    className="px-4 py-2 rounded-xl bg-indigo-950 hover:bg-indigo-900 text-white font-bold text-xs flex items-center gap-2 shadow-xs"
                                  >
                                    <Download className="w-3.5 h-3.5" />
                                    Imprimir Acta Oficial
                                  </button>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {adminTab === 'BORRADOS' && (
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
                    <h3 className="text-base font-bold text-slate-900">Autorización de Borrado en Libro Único</h3>
                    <p className="text-xs text-slate-500">Tesorería solo puede borrar registros del libro si el Pastor / Administrador lo autoriza previamente.</p>

                    <div className="space-y-3">
                      {(movimientos || []).filter((m) => m && m.solicitudBorrado && !m.borradoAutorizado).length === 0 ? (
                        <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                          <p className="text-sm text-slate-500 font-semibold">No hay solicitudes de borrado pendientes por aprobar.</p>
                        </div>
                      ) : (
                        (movimientos || [])
                          .filter((m) => m && m.solicitudBorrado && !m.borradoAutorizado)
                          .map((item) => (
                            <div key={item.id} className="p-4 rounded-xl border border-amber-300 bg-amber-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-mono font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded text-xs">{item.id}</span>
                                  <span className="font-bold text-slate-900 text-sm">{item.actividad}</span>
                                  <span className="text-xs text-slate-500">• {item.fecha}</span>
                                </div>
                                <p className="text-xs text-slate-700 mt-1">{item.descripcion}</p>
                                <p className="text-xs text-amber-900 bg-white p-2 rounded-lg border border-amber-200 mt-2">
                                  <strong>Motivo de solicitud por Tesorería:</strong> "{item.motivoBorrado}"
                                </p>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleResolverBorradoAdmin(item, true)}
                                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs"
                                >
                                  Autorizar Borrado ✓
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleResolverBorradoAdmin(item, false)}
                                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs"
                                >
                                  Denegar
                                </button>
                              </div>
                            </div>
                          ))
                      )}
                    </div>
                  </div>
                )}

                {adminTab === 'USUARIOS' && (
                  <div className="space-y-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                      <h3 className="text-base font-bold text-slate-900 mb-4">Solicitudes de Clave y Restablecimiento</h3>
                      {(usuariosSistema || []).some((u) => u && u.solicitudClave) ? (
                        <div className="space-y-3">
                          {(usuariosSistema || [])
                            .filter((u) => u && u.solicitudClave)
                            .map((usr) => (
                              <div key={usr.id} className="p-4 rounded-xl bg-amber-50 border border-amber-300 flex items-center justify-between gap-4">
                                <div>
                                  <span className="font-bold text-amber-950 text-sm">El usuario <strong className="underline">{usr.nombre}</strong> (usuario: <em>{usr.usuario}</em>) solicita restablecer sua contraseña.</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleAutorizarCambioClave(usr.id, true)}
                                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs"
                                  >
                                    Autorizar Cambio ✓
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleAutorizarCambioClave(usr.id, false)}
                                    className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold"
                                  >
                                    Rechazar
                                  </button>
                                </div>
                              </div>
                            ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500">No hay solicitudes de clave pendientes.</p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                      <div className="lg:col-span-5 bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                        <h3 className="text-base font-bold text-slate-900 mb-4">Crear Nuevo Usuario</h3>
                        <form onSubmit={handleCrearUsuarioSistema} className="space-y-3">
                          <div>
                            <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Nombre Completo</label>
                            <input
                              type="text"
                              required
                              placeholder="Ej. Hno. Juan Pérez"
                              value={nuevoUserNombre}
                              onChange={(e) => setNuevoUserNombre(e.target.value)}
                              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm bg-white"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Alias de Usuario</label>
                            <input
                              type="text"
                              required
                              placeholder="Ej. juan"
                              value={nuevoUserAlias}
                              onChange={(e) => setNuevoUserAlias(e.target.value)}
                              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm bg-white"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Contraseña Inicial</label>
                            <input
                              type="text"
                              required
                              placeholder="••••"
                              value={nuevoUserClave}
                              onChange={(e) => setNuevoUserClave(e.target.value)}
                              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm bg-white"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Rol en el Sistema</label>
                            <select
                              value={nuevoUserRol}
                              onChange={(e) => setNuevoUserRol(e.target.value)}
                              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm bg-white font-semibold"
                            >
                              <option value="RECAUDADOR">Recaudador</option>
                              <option value="TESORERO">Tesorería</option>
                              <option value="ADMINISTRADOR">Pastor / Administrador</option>
                            </select>
                          </div>
                          <button
                            type="submit"
                            className="w-full py-3 rounded-xl bg-indigo-950 hover:bg-indigo-900 text-white font-bold text-sm shadow-md transition-all mt-2"
                          >
                            Crear Usuario
                          </button>
                        </form>
                      </div>

                      <div className="lg:col-span-7 bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                        <h3 className="text-base font-bold text-slate-900 mb-4">Usuarios Registrados en el Sistema</h3>
                        <div className="space-y-3">
                          {(usuariosSistema || []).map((u) => {
                            if (!u) return null;
                            return (
                              <div key={u.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-slate-900 text-sm">{u.nombre}</span>
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${u.rol === 'ADMINISTRADOR' ? 'bg-amber-100 text-amber-900' : u.rol === 'TESORERO' ? 'bg-emerald-100 text-emerald-900' : 'bg-indigo-100 text-indigo-900'}`}>
                                      {u.rol}
                                    </span>
                                  </div>
                                  <p className="text-xs text-slate-500 mt-0.5">Usuario: <strong className="text-slate-700">{u.usuario}</strong> | Clave: {u.clave}</p>
                                </div>

                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleToggleEstadoUsuario(u.id)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold ${u.activo ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}
                                  >
                                    {u.activo ? 'Activo ✓' : 'Inactivo ✕'}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEliminarUsuarioModal(u)}
                                    className="text-slate-400 hover:text-rose-600 p-1"
                                    title="Eliminar usuario"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>

      {/* MODALES AUXILIARES */}
      {abonoModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4 animate-in fade-in zoom-in">
            <h3 className="font-bold text-base text-slate-900">Registrar Abono para {abonoModal.comprador.nombre}</h3>
            <p className="text-xs text-slate-500">Saldo pendiente actual: <strong className="text-rose-600">{formatCOP(abonoModal.saldoPendiente)}</strong></p>

            <form onSubmit={handleConfirmarAbono} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Valor del Abono ($)</label>
                <input
                  type="number"
                  min="100"
                  step="100"
                  required
                  autoFocus
                  value={valorAbonoInput}
                  onChange={(e) => setValorAbonoInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold text-slate-900 bg-white"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAbonoModal(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-indigo-950 hover:bg-indigo-900 text-white font-bold text-xs shadow-md"
                >
                  Confirmar Abono
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {arqueoItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in">
            <h3 className="font-bold text-base text-slate-900">Arqueo y Recepción de Dinero</h3>
            <p className="text-xs text-slate-500">Recaudo: <strong>{arqueoItem.actividad}</strong> (Responsable: {arqueoItem.responsable})</p>

            <form onSubmit={handleConfirmarArqueo} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Monto Físico Contado ($)</label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  required
                  autoFocus
                  value={montoFisicoContado}
                  onChange={(e) => setMontoFisicoContado(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold text-slate-900 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Nota o Observación del Arqueo</label>
                <input
                  type="text"
                  value={notaArqueo}
                  onChange={(e) => setNotaArqueo(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setArqueoItem(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-indigo-950 hover:bg-indigo-900 text-white font-bold text-xs shadow-md"
                >
                  Guardar Arqueo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {solicitudEdicionModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4 animate-in fade-in zoom-in">
            <h3 className="font-bold text-base text-slate-900">Solicitar Permiso de Edición</h3>
            <p className="text-xs text-slate-500">Escribe por qué necesitas modificar este recaudo para que Tesorería te autorice.</p>

            <form onSubmit={handleEnviarSolicitudEdicion} className="space-y-4">
              <div>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="Ej. Me equivoqué en la cantidad de tamales..."
                  value={motivoSolicitudEdicion}
                  onChange={(e) => setMotivoSolicitudEdicion(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setSolicitudEdicionModal(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-indigo-950 hover:bg-indigo-900 text-white font-bold text-xs shadow-md"
                >
                  Enviar Solicitud
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {solicitudIncobrableModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4 animate-in fade-in zoom-in">
            <h3 className="font-bold text-base text-slate-900">Solicitud de Deuda Incobrable</h3>
            <p className="text-xs text-slate-500">Explica por qué esta deuda no se va a poder cobrar para que Tesorería la apruebe.</p>

            <form onSubmit={handleEnviarSolicitudIncobrable} className="space-y-4">
              <div>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="Ej. La persona se mudó de la ciudad y no contesta..."
                  value={motivoIncobrableInput}
                  onChange={(e) => setMotivoIncobrableInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setSolicitudIncobrableModal(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md"
                >
                  Enviar a Tesorería
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {solicitudBorradoModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4 animate-in fade-in zoom-in">
            <h3 className="font-bold text-base text-slate-900">Solicitar Permiso de Borrado al Pastor</h3>
            <p className="text-xs text-slate-500">Escribe el motivo por el cual necesitas eliminar este registro del libro único.</p>

            <form onSubmit={handleEnviarSolicitudBorrado} className="space-y-4">
              <div>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="Ej. Registro duplicado por error..."
                  value={motivoBorradoInput}
                  onChange={(e) => setMotivoBorradoInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setSolicitudBorradoModal(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-indigo-950 hover:bg-indigo-900 text-white font-bold text-xs shadow-md"
                >
                  Enviar al Pastor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {eliminarItemModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center space-y-4 animate-in fade-in zoom-in">
            <div className="w-12 h-12 bg-rose-100 text-rose-700 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900">¿Eliminar registro del libro?</h3>
            <p className="text-xs text-slate-500">El Pastor ha autorizado el borrado de este registro.</p>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEliminarItemModal(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleEliminarRegistroLibro}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md"
              >
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {eliminarUsuarioModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center space-y-4 animate-in fade-in zoom-in">
            <div className="w-12 h-12 bg-rose-100 text-rose-700 rounded-full flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900">¿Eliminar usuario {eliminarUsuarioModal.nombre}?</h3>
            <p className="text-xs text-slate-500">Ya no podrá iniciar sesión en el sistema.</p>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEliminarUsuarioModal(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarEliminarUsuario}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md"
              >
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {showCambioClaveRecaudadorModal && usuarioLogueadoRecaudador && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4 animate-in fade-in zoom-in">
            <h3 className="font-bold text-base text-slate-900">Cambiar Contraseña</h3>
            <form onSubmit={handleCambiarClavePropiaRecaudador} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Contraseña Actual</label>
                <input
                  type="password"
                  required
                  value={claveActualRecInput}
                  onChange={(e) => setClaveActualRecInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Nueva Contraseña</label>
                <input
                  type="password"
                  required
                  value={claveNuevaRecInput}
                  onChange={(e) => setClaveNuevaRecInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white"
                />
              </div>
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCambioClaveRecaudadorModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-indigo-950 text-white font-bold text-xs"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCambioClaveTesoreroModal && usuarioLogueadoTesorero && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4 animate-in fade-in zoom-in">
            <h3 className="font-bold text-base text-slate-900">Cambiar Contraseña Tesorería</h3>
            <form onSubmit={handleCambiarClavePropiaTesorero} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Contraseña Actual</label>
                <input
                  type="password"
                  required
                  value={claveActualTesInput}
                  onChange={(e) => setClaveActualTesInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Nueva Contraseña</label>
                <input
                  type="password"
                  required
                  value={claveNuevaTesInput}
                  onChange={(e) => setClaveNuevaTesInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white"
                />
              </div>
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCambioClaveTesoreroModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-indigo-950 text-white font-bold text-xs"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showOlvidoClaveModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4 animate-in fade-in zoom-in">
            <h3 className="font-bold text-base text-slate-900">Recuperar Contraseña</h3>
            <p className="text-xs text-slate-500">Ingresa tu usuario (alias) para enviar una solicitud de restablecimiento al Administrador.</p>
            <form onSubmit={handleEnviarSolicitudClave} className="space-y-4">
              <div>
                <input
                  type="text"
                  required
                  placeholder="Tu usuario (ej. marta)"
                  value={usuarioOlvidoInput}
                  onChange={(e) => setUsuarioOlvidoInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white"
                />
              </div>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowOlvidoClaveModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-indigo-950 text-white font-bold text-xs"
                >
                  Enviar Solicitud
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showRestablecerClaveModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4 animate-in fade-in zoom-in">
            <h3 className="font-bold text-base text-slate-900">Restablecer con Autorización</h3>
            <p className="text-xs text-slate-500">Si el Administrador ya te autorizó, ingresa tu usuario y tu nueva contraseña.</p>
            <form onSubmit={handleConfirmarNuevoCambioClave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Tu Usuario</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. marta"
                  value={usuarioRestablecerAlias}
                  onChange={(e) => setUsuarioRestablecerAlias(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Nueva Contraseña</label>
                <input
                  type="password"
                  required
                  placeholder="••••"
                  value={nuevaClaveInput}
                  onChange={(e) => setNuevaClaveInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white"
                />
              </div>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowRestablecerClaveModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs"
                >
                  Actualizar Clave
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
