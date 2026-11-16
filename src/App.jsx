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
  if (item.modoRegistro !== 'UNIDADES') {
    return {
      esUnidades: false,
      producidas: 0,
      precioUnitario: 0,
      totalEsperado: Number(item.montoReportado) || 0,
      unidadesPagadas: 0,
      plataPagada: Number(item.montoReportado) || 0,
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
          if (data.config) setConfiguracionApp({ ...configuracionApp, ...data.config });
          if (data.cierres) setCierresMensuales(Array.isArray(data.cierres) ? data.cierres : []);
        }
        setCargandoNube(false);
      });

    const canalRealtime = supabase
      .channel('cambios_tesoreria')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'estado_tesoreria', filter: 'id=eq.1' },
        (payload) => {
          if (payload.new) {
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

  const [inputConfigTitulo, setInputConfigTitulo] = useState(configuracionApp.titulo);
  const [inputConfigSub, setInputConfigSub] = useState(configuracionApp.subtitulo);
  const [inputConfigLogo, setInputConfigLogo] = useState(configuracionApp.logoUrl);

  useEffect(() => {
    setInputConfigTitulo(configuracionApp.titulo);
    setInputConfigSub(configuracionApp.subtitulo);
    setInputConfigLogo(configuracionApp.logoUrl);
  }, [configuracionApp]);

  const [showOlvidoClaveModal, setShowOlvidoClaveModal] = useState(false);
  const [usuarioOlvidoInput, setUsuarioOlvidoInput] = useState('');

  const [showRestablecerClaveModal, setShowRestablecerClaveModal] = useState(false);
  const [usuarioRestablecerAlias, setUsuarioRestablecerAlias] = useState('');
  const [nuevaClaveInput, setNuevaClaveInput] = useState('');

  const [editingUser, setEditingUser] = useState(null);
  const [eliminarUsuarioModal, setEliminarUsuarioModal] = useState(null);

  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4500);
  };

  const [showBorrarTodoModal, setShowBorrarTodoModal] = useState(false);

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

  const [editingTesoreroMov, setEditingTesoreroMov] = useState(null);
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

  const handleBorrarTodo = () => {
    setMovimientos([]);
    setCierresMensuales([]);
    setShowBorrarTodoModal(false);
    guardarEnNube([], usuariosSistema, configuracionApp, []);
    showToast('Se han borrado todos los registros de la base de datos.', 'warning');
  };

  const handleEnviarSolicitudBorrado = (e) => {
    e.preventDefault();
    if (!solicitudBorradoModal) return;
    const motivo = motivoBorradoInput.trim();
    if (!motivo) {
      showToast('Escribe el motivo del borrado.', 'error');
      return;
    }

    const actualizados = movimientos.map((m) => {
      if (m.id === solicitudBorradoModal.id) {
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
    const actualizados = movimientos.map((m) => {
      if (m.id === item.id) {
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
    const actualizados = movimientos.filter((m) => m.id !== eliminarItemModal.id);
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
    const existe = usuariosSistema.some((u) => u.usuario.toLowerCase() === aliasLimpio);
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

    const actualizados = [...usuariosSistema, nuevoUser];
    setUsuariosSistema(actualizados);
    guardarEnNube(movimientos, actualizados, configuracionApp, cierresMensuales);
    setNuevoUserNombre('');
    setNuevoUserAlias('');
    setNuevoUserClave('');
    showToast(`Usuario ${nuevoUser.nombre} creado con éxito.`);
  };

  const handleToggleEstadoUsuario = (userId) => {
    const actualizados = usuariosSistema.map((u) => {
      if (u.id === userId) {
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
    const admins = usuariosSistema.filter(u => u.rol === 'ADMINISTRADOR');
    if (eliminarUsuarioModal.rol === 'ADMINISTRADOR' && admins.length <= 1) {
      showToast('No puedes eliminar al único administrador del sistema.', 'error');
      setEliminarUsuarioModal(null);
      return;
    }

    const actualizados = usuariosSistema.filter(u => u.id !== eliminarUsuarioModal.id);
    setUsuariosSistema(actualizados);
    guardarEnNube(movimientos, actualizados, configuracionApp, cierresMensuales);
    setEliminarUsuarioModal(null);
    showToast('Usuario eliminado del sistema correctamente.', 'warning');
  };

  const handleEjecutarCierreDeMes = (e) => {
    e.preventDefault();
    const movsDelMes = movimientos.filter(m => m.fecha && m.fecha.startsWith(mesCierreInput));
    
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

    const sinDuplicados = cierresMensuales.filter(c => c.mes !== mesCierreInput);
    const actualizadosCierres = [nuevoCierre, ...sinDuplicados];
    
    setCierresMensuales(actualizadosCierres);
    guardarEnNube(movimientos, usuariosSistema, configuracionApp, actualizadosCierres);
    showToast(`¡Cierre oficial del mes ${mesCierreInput} ejecutado y sellado por el Pastor con éxito!`);
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

    const actualizados = usuariosSistema.map((u) => {
      if (u.id === usuarioLogueadoRecaudador.id) {
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

    const actualizados = usuariosSistema.map((u) => {
      if (u.id === usuarioLogueadoTesorero.id) {
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
    const usuarioEncontrado = usuariosSistema.find((u) => u.usuario.toLowerCase() === alias);

    if (!usuarioEncontrado) {
      showToast('No se encontró ningún usuario con ese nombre en el sistema.', 'error');
      return;
    }

    const actualizados = usuariosSistema.map((u) => {
      if (u.usuario.toLowerCase() === alias) {
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
    const actualizados = usuariosSistema.map((u) => {
      if (u.id === userId) {
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

    const usr = usuariosSistema.find((u) => u.usuario.toLowerCase() === alias);
    if (!usr) {
      showToast('Usuario no encontrado.', 'error');
      return;
    }

    if (!usr.claveAutorizada) {
      showToast('Tu solicitud aún no ha sido autorizada por el Administrador.', 'warning');
      return;
    }

    const actualizados = usuariosSistema.map((u) => {
      if (u.usuario.toLowerCase() === alias) {
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

    recCompradores.forEach((c) => {
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
      unidadesFiadas,
      unidadesIncobrables,
      unidadesAsignadas,
      unidadesSinVender,
      plataRecaudada,
      plataFiada,
      plataIncobrable,
      plataSinVender,
      totalUnidadesFaltantes,
      totalPlataFaltante,
    };
  }, [recCantidadProducida, recPrecioUnitario, recCompradores]);

  const handleAgregarCompradorForm = () => {
    const nombre = nuevoCompNombre.trim();
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

    setRecCompradores([...recCompradores, nuevo]);
    setNuevoCompNombre('');
    setNuevoCompCantidad('1');
    setNuevoCompAbono('');
  };

  const handleToggleEstadoCompradorForm = (compId) => {
    const precio = Number(recPrecioUnitario) || 0;
    setRecCompradores((prev) =>
      prev.map((c) => {
        if (c.id !== compId) return c;
        const totalComp = (Number(c.cantidad) || 0) * precio;
        let nuevoEstado = 'FIADO';
        if (c.estadoPago === 'FIADO') nuevoEstado = 'PAGADO';
        else if (c.estadoPago === 'PAGADO') nuevoEstado = 'INCOBRABLE';
        else if (c.estadoPago === 'INCOBRABLE') nuevoEstado = 'FIADO';

        return {
          ...c,
          estadoPago: nuevoEstado,
          montoAbonado: nuevoEstado === 'PAGADO' ? totalComp : nuevoEstado === 'INCOBRABLE' ? 0 : c.montoAbonado,
        };
      })
    );
  };

  const handleEnviarSolicitudIncobrable = (e) => {
    e.preventDefault();
    if (!solicitudIncobrableModal) return;
    const motivo = motivoIncobrableInput.trim();
    if (!motivo) {
      showToast('Escribe el motivo por el cual la deuda es incobrable.', 'error');
      return;
    }

    const { movimientoId, compradorId } = solicitudIncobrableModal;
    let nombreDeudorLocal = '';

    const actualizados = movimientos.map((m) => {
      if (m.id !== movimientoId || m.modoRegistro !== 'UNIDADES') return m;
      const comps = (m.compradores || []).map((c) => {
        if (c.id !== compradorId) return c;
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
    const nombreTesoreroActual = usuarioLogueadoTesorero ? usuarioLogueadoTesorero.nombre : 'Tesorero';

    const actualizados = movimientos.map((m) => {
      if (m.id !== movimientoId || m.modoRegistro !== 'UNIDADES') return m;
      let nombreComp = '';
      const comps = (m.compradores || []).map((c) => {
        if (c.id !== compradorId) return c;
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
      prev.map((c) => {
        if (c.id !== compId) return c;
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
    setRecCompradores((prev) => prev.filter((c) => c.id !== compId));
  };

  const handleRegistrarRecaudo = (e) => {
    e.preventDefault();
    const nombreResponsable = usuarioLogueadoRecaudador ? usuarioLogueadoRecaudador.nombre : 'Recaudador';
    
    const actividadFinal = recActividadLibre.trim();
    if (!actividadFinal) {
      showToast('Escribe el nombre de la actividad.', 'error');
      return;
    }

    if (modoRecaudo === 'UNIDADES') {
      const producidas = Number(recCantidadProducida) || 0;
      const precio = Number(recPrecioUnitario) || 0;
      const valorRecaudadoEnMano = resumenFormUnidades.plataRecaudada;
      const descFinal =
        recDescripcion.trim() ||
        `Producción de ${producidas} unidades a ${formatCOP(precio)} c/u (${resumenFormUnidades.unidadesPagadas} pagadas, ${resumenFormUnidades.unidadesFiadas} fiadas)`;

      if (editingRecaudoId) {
        const actualizados = movimientos.map((m) =>
          m.id === editingRecaudoId
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
                compradores: [...recCompradores],
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
        compradores: [...recCompradores],
        montoReportado: valorRecaudadoEnMano,
        montoRecibido: 0,
        montoSalida: 0,
        estado: 'PENDIENTE',
        notaTesorero: '',
      };

      const actualizados = [nuevoReg, ...movimientos];
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
      const actualizados = movimientos.map((m) =>
        m.id === editingRecaudoId
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
    };

    const actualizados = [nuevoReg, ...movimientos];
    setMovimientos(actualizados);
    guardarEnNube(actualizados, usuariosSistema, configuracionApp, cierresMensuales);
    setRecDescripcion('');
    setRecActividadLibre('');
    setRecMonto('');
    showToast('Recaudo general enviado a Tesorería.');
  };

  const handleIniciarEdicion = (item) => {
    if (!item.edicionAutorizada) {
      showToast('Necesitas solicitar autorización de edición a Tesorería.', 'warning');
      return;
    }
    setEditingRecaudoId(item.id);
    setRecFecha(item.fecha);
    setRecActividadLibre(item.actividad);
    setRecDescripcion(item.descripcion);
    setRecMetodo(item.metodoPago || 'Efectivo');
    if (item.modoRegistro === 'UNIDADES') {
      setModoRecaudo('UNIDADES');
      setRecCantidadProducida(String(item.cantidadProducida));
      setRecPrecioUnitario(String(item.precioUnitario));
      setRecCompradores(Array.isArray(item.compradores) ? [...item.compradores] : []);
    } else {
      setModoRecaudo('GENERAL');
      setRecMonto(String(item.montoReportado));
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
    showToast('Modo edición activado. Puedes corregir cantidades y compradores.');
  };

  const handleEnviarSolicitudEdicion = (e) => {
    e.preventDefault();
    if (!solicitudEdicionModal) return;
    const motivo = motivoSolicitudEdicion.trim();
    if (!motivo) return;

    const actualizados = movimientos.map((m) =>
      m.id === solicitudEdicionModal.id ? { ...m, solicitudEdicion: true, motivoEdicion: motivo } : m
    );
    setMovimientos(actualizados);
    guardarEnNube(actualizados, usuariosSistema, configuracionApp, cierresMensuales);
    showToast('Solicitud de edición enviada a Tesorería.');
    setSolicitudEdicionModal(null);
    setMotivoSolicitudEdicion('');
  };

  const handleAutorizarEdicionTesorero = (item, aprobar) => {
    const actualizados = movimientos.map((m) =>
      m.id === item.id
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
    const abonoNuevo = Number(valorAbonoInput.toString().replace(/\D/g, '')) || 0;
    if (abonoNuevo <= 0) return;

    const actualizados = movimientos.map((m) => {
      if (m.id !== abonoModal.movimientoId || m.modoRegistro !== 'UNIDADES') return m;
      const precio = Number(m.precioUnitario) || 0;
      
      const comps = (m.compradores || []).map((c) => {
        if (c.id !== abonoModal.comprador.id) return c;
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

      const yaSeEntregoAlgo = (Number(m.montoRecibido) || 0) > 0;

      if (!yaSeEntregoAlgo) {
        const nuevoTotalReportado = (Number(m.montoReportado) || 0) + abonoNuevo;
        return {
          ...m,
          compradores: comps,
          montoReportado: nuevoTotalReportado,
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
    let valorAbonadoExtra = 0;
    const actualizados = movimientos.map((m) => {
      if (m.id !== movimientoId || m.modoRegistro !== 'UNIDADES') return m;
      const precio = Number(m.precioUnitario) || 0;
      const comps = (m.compradores || []).map((c) => {
        if (c.id !== compradorId) return c;
        const totalC = (Number(c.cantidad) || 0) * precio;
        const abonadoPrevio = c.estadoPago === 'PAGADO' ? totalC : Math.min(totalC, Math.max(0, Number(c.montoAbonado) || 0));
        valorAbonadoExtra = Math.max(0, totalC - abonadoPrevio);
        return { ...c, estadoPago: 'PAGADO', montoAbonado: totalC };
      });

      const yaSeEntregoAlgo = (Number(m.montoRecibido) || 0) > 0;

      if (!yaSeEntregoAlgo) {
        const nuevoTotalReportado = (Number(m.montoReportado) || 0) + valorAbonadoExtra;
        return {
          ...m,
          compradores: comps,
          montoReportado: nuevoTotalReportado,
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

    movimientos.forEach((m) => {
      if (m.tipo === 'INGRESO' && m.responsable === nombreRec) {
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

    movimientos.forEach((m) => {
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
            if (c.solicitudIncobrable) cantidadSolicitudesIncobrable += 1;
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
    const uInput = recUserLoginInput.trim().toLowerCase();
    const pInput = recPassLoginInput.trim();

    const encontrado = usuariosSistema.find(
      (u) => u.rol === 'RECAUDADOR' && u.usuario.toLowerCase() === uInput && u.clave === pInput
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
    const uInput = tesUserLoginInput.trim().toLowerCase();
    const pInput = tesPassLoginInput.trim();

    const encontrado = usuariosSistema.find(
      (u) => u.rol === 'TESORERO' && u.usuario.toLowerCase() === uInput && u.clave === pInput
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
    const uInput = adminUserLoginInput.trim().toLowerCase();
    const pInput = adminPassLoginInput.trim();

    const encontrado = usuariosSistema.find(
      (u) => u.rol === 'ADMINISTRADOR' && u.usuario.toLowerCase() === uInput && u.clave === pInput
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
    setArqueoItem(item);
    const montoPendienteARecibir = Number(item.ultimoAbonoReportado) > 0 ? Number(item.ultimoAbonoReportado) : Number(item.montoReportado);
    setMontoFisicoContado(String(montoPendienteARecibir));
    setNotaArqueo(item.notaTesorero || '');
  };

  const handleConfirmarArqueo = (e) => {
    e.preventDefault();
    if (!arqueoItem) return;
    const contado = Number(montoFisicoContado.toString().replace(/\D/g, ''));
    const reportadoEsperado = Number(arqueoItem.ultimoAbonoReportado) > 0 ? Number(arqueoItem.ultimoAbonoReportado) : Number(arqueoItem.montoReportado);
    const esExacto = contado === reportadoEsperado;

    const nombreTesoreroActual = usuarioLogueadoTesorero ? usuarioLogueadoTesorero.nombre : 'Tesorero';

    const actualizados = movimientos.map((m) => {
      if (m.id === arqueoItem.id) {
        const recibidoAnterior = Number(m.montoRecibido) || 0;
        const totalRecibidoReal = recibidoAnterior + contado;
        const nuevoReportadoTotal = Number(m.ultimoAbonoReportado) > 0 
          ? (Number(m.montoReportado) || 0) + Number(m.ultimoAbonoReportado) 
          : Number(m.montoReportado);

        return {
          ...m,
          montoReportado: nuevoReportadoTotal,
          montoRecibido: totalRecibidoReal,
          estado: esExacto ? 'VERIFICADO' : 'DESCUADRE',
          edicionAutorizada: false,
          solicitudEdicion: false,
          ultimoAbonoReportado: 0,
          notaTesorero:
            notaArqueo.trim() ||
            (esExacto
              ? `Recibido por ${nombreTesoreroActual} (${formatCOP(contado)}).`
              : `Recibido por ${nombreTesoreroActual}. Faltaron ${formatCOP(reportadoEsperado - contado)}.`),
        };
      }
      return m;
    });

    setMovimientos(actualizados);
    guardarEnNube(actualizados, usuariosSistema, configuracionApp, cierresMensuales);
    setArqueoItem(null);
    showToast(esExacto ? 'Dinero recibido y sumado a caja correctamente.' : 'Arqueo guardado con descuadre.');
  };

  const handleCerrarRecaudoSinMasNovedad = (item) => {
    const nombreTesoreroActual = usuarioLogueadoTesorero ? usuarioLogueadoTesorero.nombre : 'Tesorero';
    const abonoPendiente = Number(item.ultimoAbonoReportado) > 0 ? Number(item.ultimoAbonoReportado) : Number(item.montoReportado);

    const actualizados = movimientos.map((m) => {
      if (m.id === item.id) {
        const recibidoAnterior = Number(m.montoRecibido) || 0;
        const nuevoReportadoTotal = Number(m.ultimoAbonoReportado) > 0 
          ? (Number(m.montoReportado) || 0) + Number(m.ultimoAbonoReportado) 
          : Number(m.montoReportado);

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
    const actualizados = movimientos.map((m) => {
      if (m.id === item.id) {
        return {
          ...m,
          montoReportado: m.montoRecibido,
          estado: 'VERIFICADO',
          edicionAutorizada: false,
          notaTesorero: `${m.notaTesorero} [Ajuste aprobado por Tesorería y cerrado]`,
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
      notaTesorero: egrNota.trim() + (sobrante > 0 ? ` [Sobrante devuelto y retornado a caja: ${formatCOP(sobrante)}]` : ''),
    };

    const actualizados = [nuevoEgreso, ...movimientos];
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
    const rows = movimientos.map((m) => [
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
    return movimientos
      .filter((m) => {
        if (filtroLibro === 'TODOS') return true;
        if (filtroLibro === 'INGRESOS') return m.tipo === 'INGRESO';
        if (filtroLibro === 'EGRESOS') return m.tipo === 'EGRESO';
        return m.estado === filtroLibro;
      })
      .filter((m) => {
        if (!busquedaLibro.trim()) return true;
        const q = busquedaLibro.toLowerCase();
        return (
          m.actividad.toLowerCase().includes(q) ||
          m.descripcion.toLowerCase().includes(q) ||
          m.responsable.toLowerCase().includes(q) ||
          m.id.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  }, [movimientos, filtroLibro, busquedaLibro]);

  const renderEstadoBadge = (m) => {
    switch (m.estado) {
      case 'VERIFICADO':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Recibido / Verificado
          </span>
        );
      case 'PENDIENTE':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            Pendiente por recibir
          </span>
        );
      case 'DESCUADRE':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            Descuadre en revisión
          </span>
        );
      case 'EGRESO_REGISTRADO':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <ArrowDownRight className="w-3.5 h-3.5 text-rose-500" />
            Salida de Caja
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-16">
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
                {(kpis.cantidadSolicitudesBorrado + (usuariosSistema.some(u => u.solicitudClave) ? 1 : 0)) > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 text-[10px] font-extrabold rounded-full bg-rose-600 text-white animate-pulse">
                    {kpis.cantidadSolicitudesBorrado + (usuariosSistema.some(u => u.solicitudClave) ? 1 : 0)}
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

                              {recCompradores.length > 0 && (
                                <div className="max-h-52 overflow-y-auto divide-y divide-slate-200 bg-white rounded-lg border border-slate-200 p-2 space-y-2">
                                  {recCompradores.map((c) => {
                                    const totalC = (Number(c.cantidad) || 0) * resumenFormUnidades.precio;
                                    const abonoC = c.estadoPago === 'PAGADO' ? totalC : c.estadoPago === 'INCOBRABLE' ? 0 : Math.min(totalC, Math.max(0, Number(c.montoAbonado) || 0));
                                    const saldoC = c.estadoPago === 'INCOBRABLE' ? 0 : Math.max(0, totalC - abonoC);

                                    return (
                                      <div key={c.id} className="p-2 bg-slate-50 rounded-lg border border-slate-200 space-y-2 text-xs">
                                        <div className="flex items-center justify-between gap-2">
                                          <input
                                            type="text"
                                            value={c.nombre}
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
                                              value={c.cantidad}
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
                          className={`w-full py-3.5 rounded-xl text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 ${
                            editingRecaudoId ? 'bg-amber-600 hover:bg-amber-700' : 'bg-emerald-600 hover:bg-emerald-700'
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
                          {movimientos.filter((m) => m.tipo === 'INGRESO' && m.responsable === usuarioLogueadoRecaudador.nombre).length} actividades
                        </span>
                      </div>

                      <div className="space-y-4">
                        {movimientos.filter((m) => m.tipo === 'INGRESO' && m.responsable === usuarioLogueadoRecaudador.nombre).length === 0 ? (
                          <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                            <p className="text-sm font-semibold text-slate-600">No hay recaudos registrados todavía por ti.</p>
                          </div>
                        ) : (
                          movimientos
                            .filter((m) => m.tipo === 'INGRESO' && m.responsable === usuarioLogueadoRecaudador.nombre)
                            .map((item) => {
                              const inv = calcularResumenInventario(item);
                              const isExpanded = !!expandedRows[item.id];

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
                                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Recaudado total:</span>
                                        <span className="text-lg font-extrabold text-slate-900">
                                          {formatCOP(item.montoReportado)}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2 flex-wrap justify-end">
                                        {item.edicionAutorizada ? (
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

                                      {item.compradores && item.compradores.length > 0 && (
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
                                                const totalComp = c.cantidad * inv.precioUnitario;
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
                                                      {c.estadoPago !== 'INCOBRABLE' && !c.solicitudIncobrable && saldoPendiente > 0 && (
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
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all"
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
                    <span className="text-[10px]
