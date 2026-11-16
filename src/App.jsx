import React, { useState, useEffect, useMemo } from 'react';
import {
  Wallet,
  HandCoins,
  ShieldCheck,
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
  ShieldAlert,
  KeyRound,
  HelpCircle,
  Calendar,
  TrendingDown,
  Settings
} from 'lucide-react';

const supabaseUrl = 'https://nymwaxuzfyclynucwavr.supabase.co';
const supabaseKey = 'sb_publishable_EPQQAp7s9TRI0Qa0bBMxLQ_62mefp-a';

const supabaseRest = {
  async fetchEstado() {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/estado_tesoreria?id=eq.1&select=datos,usuarios,config,cierres`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
      }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const rows = await res.json();
    return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
  },
  async upsertEstado(payload) {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/estado_tesoreria?on_conflict=id`,
      {
        method: 'POST',
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          Prefer: 'resolution=merge-duplicates,return=minimal',
        },
        body: JSON.stringify(payload),
      }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  },
};

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

  const unidadesSinVender = Math.max(
    0,
    producidas - (unidadesPagadas + unidadesFiadas + unidadesIncobrables)
  );
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
    logoUrl: '',
    nombreIglesia: 'Iglesia Central Comunitaria'
  });

  const [usuariosSistema, setUsuariosSistema] = useState([
    { id: 'US-0', nombre: 'Administrador / Pastor', usuario: 'admin', clave: 'admin2026', rol: 'ADMINISTRADOR', activo: true, solicitudClave: false, claveAutorizada: false },
    { id: 'US-1', nombre: 'Tesorero Principal', usuario: 'tesorero', clave: '1234', rol: 'TESORERO', activo: true, solicitudClave: false, claveAutorizada: false },
    { id: 'US-2', nombre: 'Hna. Marta Gómez', usuario: 'marta', clave: '2026', rol: 'RECAUDADOR', activo: true, solicitudClave: false, claveAutorizada: false },
    { id: 'US-3', nombre: 'Hno. Carlos Ruiz', usuario: 'carlos', clave: '2026', rol: 'RECAUDADOR', activo: true, solicitudClave: false, claveAutorizada: false }
  ]);

  const [cargandoNube, setCargandoNube] = useState(true);

  useEffect(() => {
    let montado = true;

    const sincronizarDesdeNube = async (esInicial = false) => {
      try {
        const data = await supabaseRest.fetchEstado();
        if (data && montado) {
          if (data.datos) setMovimientos(Array.isArray(data.datos) ? data.datos : []);
          if (data.usuarios && Array.isArray(data.usuarios)) setUsuariosSistema(data.usuarios);
          if (data.config) {
            setConfiguracionApp((prev) => ({ ...prev, ...data.config }));
            setAdminConfigTitulo(data.config.titulo || 'Tesorería & Recaudos Eclesiásticos');
            setAdminConfigSubtitulo(data.config.subtitulo || '');
            setAdminConfigLogoUrl(data.config.logoUrl || '');
          }
          if (data.cierres) setCierresMensuales(Array.isArray(data.cierres) ? data.cierres : []);
        }
      } catch (err) {
        if (esInicial) {
          console.warn('Modo local/offline activo o error al consultar Supabase:', err);
        }
      } finally {
        if (esInicial && montado) setCargandoNube(false);
      }
    };

    sincronizarDesdeNube(true);

    const intervaloSync = setInterval(() => {
      sincronizarDesdeNube(false);
    }, 8000);

    return () => {
      montado = false;
      clearInterval(intervaloSync);
    };
  }, []);

  const guardarEnNube = async (nuevosMovs, nuevosUsuarios, nuevaConfig, nuevosCierres) => {
    if (cargandoNube) return;
    try {
      await supabaseRest.upsertEstado({
        id: 1,
        datos: nuevosMovs || movimientos,
        usuarios: nuevosUsuarios || usuariosSistema,
        config: nuevaConfig || configuracionApp,
        cierres: nuevosCierres || cierresMensuales
      });
    } catch (err) {
      console.warn('Error de red al guardar en Supabase:', err);
    }
  };

  const esMesCerrado = (fechaStr) => {
    if (!fechaStr) return false;
    const mesKey = fechaStr.substring(0, 7);
    return (cierresMensuales || []).some((c) => c && c.mes === mesKey);
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

  const [adminConfigTitulo, setAdminConfigTitulo] = useState(configuracionApp.titulo);
  const [adminConfigSubtitulo, setAdminConfigSubtitulo] = useState(configuracionApp.subtitulo);
  const [adminConfigLogoUrl, setAdminConfigLogoUrl] = useState(configuracionApp.logoUrl);
  const [adminConfigIglesia, setAdminConfigIglesia] = useState(configuracionApp.nombreIglesia || 'Iglesia Central Comunitaria');

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

  const [sobranteLibroModal, setSobranteLibroModal] = useState(null);
  const [valorSobranteLibroInput, setValorSobranteLibroInput] = useState('');

  const [solicitudEdicionLibroModal, setSolicitudEdicionLibroModal] = useState(null);
  const [motivoEdicionLibroInput, setMotivoEdicionLibroInput] = useState('');

  const [editarLibroModal, setEditarLibroModal] = useState(null);
  const [editLibroFecha, setEditLibroFecha] = useState('');
  const [editLibroActividad, setEditLibroActividad] = useState('');
  const [editLibroDescripcion, setEditLibroDescripcion] = useState('');
  const [editLibroResponsable, setEditLibroResponsable] = useState('');
  const [editLibroMonto, setEditLibroMonto] = useState('');
  const [editLibroSobrante, setEditLibroSobrante] = useState('');

  const [actaAImprimirId, setActaAImprimirId] = useState(null);
  const [editandoActaId, setEditandoActaId] = useState(null);
  const [textoActaEditado, setTextoActaEditado] = useState('');

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

  const handleConfirmarSobranteLibro = (e) => {
    e.preventDefault();
    if (!sobranteLibroModal) return;
    if (esMesCerrado(sobranteLibroModal.fecha)) {
      showToast('Este registro pertenece a un mes cerrado oficialmente por el Pastor.', 'error');
      return;
    }
    const devueltoNuevo = Number(valorSobranteLibroInput.toString().replace(/\D/g, '')) || 0;
    if (devueltoNuevo <= 0) {
      showToast('Ingresa un valor válido mayor a $0.', 'error');
      return;
    }
    const salidaTotal = Number(sobranteLibroModal.montoSalida) || 0;
    const devueltoPrevio = Number(sobranteLibroModal.montoSobranteDevuelto) || 0;
    if (devueltoPrevio + devueltoNuevo >= salidaTotal) {
      showToast('El sobrante total devuelto no puede ser mayor o igual al valor entregado.', 'error');
      return;
    }

    const nombreTesoreroActual = usuarioLogueadoTesorero ? usuarioLogueadoTesorero.nombre : 'Tesorero';
    const actualizados = (movimientos || []).map((m) => {
      if (m && m.id === sobranteLibroModal.id) {
        const totalDevuelto = devueltoPrevio + devueltoNuevo;
        return {
          ...m,
          montoSobranteDevuelto: totalDevuelto,
          notaTesorero: `${m.notaTesorero ? m.notaTesorero + ' | ' : ''}[Sobrante reintegrado a caja: +${formatCOP(devueltoNuevo)} por ${nombreTesoreroActual}]`
        };
      }
      return m;
    });

    setMovimientos(actualizados);
    guardarEnNube(actualizados, usuariosSistema, configuracionApp, cierresMensuales);
    setSobranteLibroModal(null);
    setValorSobranteLibroInput('');
    showToast(`Sobrante de ${formatCOP(devueltoNuevo)} reintegrado y sumado al saldo de caja.`);
  };

  const handleEnviarSolicitudEdicionLibro = (e) => {
    e.preventDefault();
    if (!solicitudEdicionLibroModal) return;
    if (esMesCerrado(solicitudEdicionLibroModal.fecha)) {
      showToast('Este registro pertenece a un mes cerrado oficialmente por el Pastor.', 'error');
      return;
    }
    const motivo = motivoEdicionLibroInput.trim();
    if (!motivo) {
      showToast('Escribe el motivo de la corrección.', 'error');
      return;
    }

    const actualizados = (movimientos || []).map((m) => {
      if (m && m.id === solicitudEdicionLibroModal.id) {
        return {
          ...m,
          solicitudEdicionLibro: true,
          motivoEdicionLibro: motivo,
          solicitanteEdicionLibro: usuarioLogueadoTesorero ? usuarioLogueadoTesorero.nombre : 'Tesorería'
        };
      }
      return m;
    });

    setMovimientos(actualizados);
    guardarEnNube(actualizados, usuariosSistema, configuracionApp, cierresMensuales);
    setSolicitudEdicionLibroModal(null);
    setMotivoEdicionLibroInput('');
    showToast('Solicitud de edición enviada al Pastor / Administrador.');
  };

  const handleResolverEdicionLibroAdmin = (item, autorizar) => {
    if (!item) return;
    const actualizados = (movimientos || []).map((m) => {
      if (m && m.id === item.id) {
        if (autorizar) {
          return {
            ...m,
            solicitudEdicionLibro: false,
            edicionLibroAutorizada: true,
            notaTesorero: `${m.notaTesorero || ''} [Pastor autorizó corrección en Libro Único]`
          };
        } else {
          return {
            ...m,
            solicitudEdicionLibro: false,
            edicionLibroAutorizada: false,
            motivoEdicionLibro: '',
            notaTesorero: `${m.notaTesorero || ''} [Pastor denegó corrección en Libro Único]`
          };
        }
      }
      return m;
    });
    setMovimientos(actualizados);
    guardarEnNube(actualizados, usuariosSistema, configuracionApp, cierresMensuales);
    showToast(autorizar ? 'Corrección autorizada. Tesorería ya puede editar el registro.' : 'Solicitud de corrección denegada.');
  };

  const openEditarLibroModal = (item) => {
    if (!item || esMesCerrado(item.fecha)) return;
    setEditarLibroModal(item);
    setEditLibroFecha(item.fecha || '');
    setEditLibroActividad(item.actividad || '');
    setEditLibroDescripcion(item.descripcion || '');
    setEditLibroResponsable(item.responsable || '');
    if (item.tipo === 'INGRESO') {
      setEditLibroMonto(String(Number(item.montoRecibido) || Number(item.montoReportado) || 0));
      setEditLibroSobrante('0');
    } else {
      setEditLibroMonto(String(Number(item.montoSalida) || 0));
      setEditLibroSobrante(String(Number(item.montoSobranteDevuelto) || 0));
    }
  };

  const handleGuardarEdicionLibro = (e) => {
    e.preventDefault();
    if (!editarLibroModal) return;
    if (esMesCerrado(editLibroFecha)) {
      showToast('La fecha seleccionada pertenece a un mes cerrado por el Pastor.', 'error');
      return;
    }
    const montoNum = Number(editLibroMonto.toString().replace(/\D/g, '')) || 0;
    const sobranteNum = Number(editLibroSobrante.toString().replace(/\D/g, '')) || 0;

    if (!editLibroActividad.trim() || !editLibroDescripcion.trim() || montoNum < 0) {
      showToast('Verifica los datos ingresados.', 'error');
      return;
    }
    if (editarLibroModal.tipo === 'EGRESO' && sobranteNum >= montoNum) {
      showToast('El sobrante devuelto no puede ser mayor o igual a la salida total.', 'error');
      return;
    }

    const nombreTesoreroActual = usuarioLogueadoTesorero ? usuarioLogueadoTesorero.nombre : 'Tesorero';
    const actualizados = (movimientos || []).map((m) => {
      if (m && m.id === editarLibroModal.id) {
        if (m.tipo === 'INGRESO') {
          return {
            ...m,
            fecha: editLibroFecha,
            actividad: editLibroActividad.trim(),
            descripcion: editLibroDescripcion.trim(),
            responsable: editLibroResponsable.trim(),
            montoReportado: montoNum,
            montoRecibido: montoNum,
            edicionLibroAutorizada: false,
            solicitudEdicionLibro: false,
            motivoEdicionLibro: '',
            notaTesorero: `${m.notaTesorero ? m.notaTesorero + ' | ' : ''}[Registro corregido por ${nombreTesoreroActual} con autorización Pastoral]`
          };
        } else {
          return {
            ...m,
            fecha: editLibroFecha,
            actividad: editLibroActividad.trim(),
            descripcion: editLibroDescripcion.trim(),
            responsable: editLibroResponsable.trim(),
            montoSalida: montoNum,
            montoSobranteDevuelto: sobranteNum,
            edicionLibroAutorizada: false,
            solicitudEdicionLibro: false,
            motivoEdicionLibro: '',
            notaTesorero: `${m.notaTesorero ? m.notaTesorero + ' | ' : ''}[Egreso corregido por ${nombreTesoreroActual} with autorización Pastoral]`
          };
        }
      }
      return m;
    });

    setMovimientos(actualizados);
    guardarEnNube(actualizados, usuariosSistema, configuracionApp, cierresMensuales);
    setEditarLibroModal(null);
    showToast('Registro del Libro Único corregido y actualizado con éxito.');
  };

  const handleGuardarConfiguracionApp = (e) => {
    e.preventDefault();
    const nuevaConf = {
      titulo: adminConfigTitulo.trim() || 'Tesorería & Recaudos Eclesiásticos',
      subtitulo: adminConfigSubtitulo.trim() || 'Control Estricto de Recaudos, Abonos y Cierres en Tiempo Real • Supabase',
      logoUrl: adminConfigLogoUrl.trim(),
      nombreIglesia: adminConfigIglesia.trim() || 'Iglesia Central Comunitaria'
    };
    setConfiguracionApp(nuevaConf);
    guardarEnNube(movimientos, usuariosSistema, nuevaConf, cierresMensuales);
    showToast('¡Configuración de la plataforma actualizada con éxito!');
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
    const admins = (usuariosSistema || []).filter((u) => u && u.rol === 'ADMINISTRADOR');
    if (eliminarUsuarioModal.rol === 'ADMINISTRADOR' && admins.length <= 1) {
      showToast('No puedes eliminar al único administrador del sistema.', 'error');
      setEliminarUsuarioModal(null);
      return;
    }

    const actualizados = (usuariosSistema || []).filter((u) => u && u.id !== eliminarUsuarioModal.id);
    setUsuariosSistema(actualizados);
    guardarEnNube(movimientos, actualizados, configuracionApp, cierresMensuales);
    setEliminarUsuarioModal(null);
    showToast('Usuario eliminado del sistema correctamente.', 'warning');
  };

  const handleEjecutarCierreDeMes = (e) => {
    e.preventDefault();
    const movsDelMes = (movimientos || []).filter((m) => m && m.fecha && m.fecha.startsWith(mesCierreInput));

    let entradasMes = 0;
    let salidasMes = 0;
    movsDelMes.forEach((m) => {
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

    const sinDuplicados = (cierresMensuales || []).filter((c) => c && c.mes !== mesCierreInput);
    const actualizadosCierres = [nuevoCierre, ...sinDuplicados];

    setCierresMensuales(actualizadosCierres);
    guardarEnNube(movimientos, usuariosSistema, configuracionApp, actualizadosCierres);
    showToast(`¡Cierre oficial del mes ${mesCierreInput} ejecutado y sellado por el Pastor con éxito!`);
  };

  const handleReabrirMesPastor = (mesKey) => {
    const actualizadosCierres = (cierresMensuales || []).filter((c) => c && c.mes !== mesKey);
    setCierresMensuales(actualizadosCierres);
    guardarEnNube(movimientos, usuariosSistema, configuracionApp, actualizadosCierres);
    showToast(`El mes ${mesKey} ha sido reabierto por el Pastor. Ya se permiten modificaciones.`, 'warning');
  };

  const handleGuardarTextoActa = (cierreId) => {
    const actualizadosCierres = (cierresMensuales || []).map((c) => {
      if (c && c.id === cierreId) {
        return { ...c, textoPersonalizado: textoActaEditado.trim() };
      }
      return c;
    });
    setCierresMensuales(actualizadosCierres);
    guardarEnNube(movimientos, usuariosSistema, configuracionApp, actualizadosCierres);
    setEditandoActaId(null);
    showToast('Texto del acta actualizado con éxito.');
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
      plataRecaudada,
      unidadesFiadas,
      plataFiada,
      unidadesIncobrables,
      plataIncobrable,
      unidadesSinVender,
      plataSinVender,
      unidadesAsignadas,
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
    const movTarget = (movimientos || []).find((m) => m && m.id === movimientoId);
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
        const itemEdit = movimientos.find((m) => m && m.id === editingRecaudoId);
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
      const itemEdit = movimientos.find((m) => m && m.id === editingRecaudoId);
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
      fecha: movimiento.fecha,
      comprador,
      saldoPendiente,
    });
    setValorAbonoInput(String(saldoPendiente));
  };

  const handleConfirmarAbono = (e) => {
    e.preventDefault();
    if (!abonoModal) return;
    const movTarget = movimientos.find((m) => m && m.id === abonoModal.movimientoId);
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
    const movTarget = movimientos.find((m) => m && m.id === movimientoId);
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
    let cantidadSolicitudesEdicionLibro = 0;
    let totalPlataFiadaCalle = 0;
    let totalPlataSinVenderCalle = 0;

    (movimientos || []).forEach((m) => {
      if (!m) return;
      if (m.solicitudBorrado && !m.borradoAutorizado) cantidadSolicitudesBorrado += 1;
      if (m.solicitudEdicionLibro && !m.edicionLibroAutorizada) cantidadSolicitudesEdicionLibro += 1;

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
      cantidadSolicitudesEdicionLibro,
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

    const reportadoEsperado = Number(arqueoItem.ultimoAbonoReportado) > 0
      ? Number(arqueoItem.ultimoAbonoReportado)
      : Number(arqueoItem.montoReportado || 0);

    const esExacto = contado === reportadoEsperado;
    const nombreTesoreroActual = usuarioLogueadoTesorero ? usuarioLogueadoTesorero.nombre : 'Tesorero';

    const actualizados = (movimientos || []).map((m) => {
      if (m && m.id === arqueoItem.id) {
        const recibidoAnterior = Number(m.montoRecibido) || 0;
        const totalRecibidoReal = recibidoAnterior + contado;

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
    const descDetallada = `Salida detallada por concepto de [${egrCategoria}]: ${egrConcepto.trim()}. Destinatario/Responsable: ${egrResponsable.trim()}`;

    const nuevoEgreso = {
      id: `EGR-${Math.floor(100 + Math.random() * 900)}`,
      fecha: egrFecha,
      tipo: 'EGRESO',
      actividad: egrCategoria,
      descripcion: descDetallada,
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
          @page {
            margin: 15mm;
          }
          body * {
            visibility: hidden !important;
          }
          .acta-imprimible-activa, .acta-imprimible-activa * {
            visibility: visible !important;
          }
          .acta-imprimible-activa {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 24px !important;
            box-shadow: none !important;
            border: 2px solid #1e1b4b !important;
            background: white !important;
            z-index: 99999 !important;
          }
          .no-print, .no-print * {
            display: none !important;
            visibility: hidden !important;
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
                {(kpis.cantidadSolicitudesBorrado + kpis.cantidadSolicitudesEdicionLibro + ((usuariosSistema || []).some((u) => u && u.solicitudClave) ? 1 : 0)) > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 text-[10px] font-extrabold rounded-full bg-rose-600 text-white animate-pulse">
                    {kpis.cantidadSolicitudesBorrado + kpis.cantidadSolicitudesEdicionLibro + ((usuariosSistema || []).some((u) => u && u.solicitudClave) ? 1 : 0)}
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
                      Recaudador Conectado
