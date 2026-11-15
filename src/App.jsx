import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, ShieldAlert, Wallet, TrendingUp, TrendingDown, Clock, 
  AlertTriangle, FileSpreadsheet, Search, Lock, KeyRound, HelpCircle, 
  Users, UserCheck, UserX, UserPlus, Trash2, Edit3, Calculator, 
  ShoppingBag, Download, X, Eye, Settings, CheckCircle2, Calendar 
} from 'lucide-react';

// Formato de moneda COP
const formatCOP = (val) => {
  const num = Number(val) || 0;
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(num);
};

const CATEGORIAS_EGRESO = [
  'Alimentación y Refrigerios',
  'Servicios Públicos',
  'Mantenimiento e Instalaciones',
  'Ayudas Sociales / Beneficencia',
  'Materiales y Papelería',
  'Transporte y Viáticos',
  'Imprevistos y Varios'
];

export default function App() {
  // Estado general de roles y pestañas
  const [activeRole, setActiveRole] = useState('RECAUDADOR'); // 'RECAUDADOR', 'TESORERO', 'ADMINISTRADOR'
  const [recaudadorTab, setRecaudadorTab] = useState('REGISTRO'); // 'REGISTRO', 'MIS_MOVIMIENTOS'
  const [tesoreroTab, setTesoreroTab] = useState('BANDEJA'); // 'BANDEJA', 'EGRESOS', 'LIBRO', 'CIERRE_MES'
  const [adminTab, setAdminTab] = useState('AUDITORIA'); // 'AUDITORIA', 'USUARIOS', 'CIERRE_MES'

  // Datos globales simulados o cargados de localStorage
  const [movimientos, setMovimientos] = useState(() => {
    const saved = localStorage.getItem('tesoreria_movimientos');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return [
      {
        id: 'MOV-1001',
        tipo: 'INGRESO',
        fecha: '2026-11-01',
        actividad: 'Diezmos y Ofrendas Dominicales',
        descripcion: 'Cultivo general de adoración y ofrendas especiales.',
        responsable: 'Hna. Marta Gómez',
        metodoPago: 'Efectivo',
        montoReportado: 1250000,
        montoRecibido: 1250000,
        estado: 'VERIFICADO', // 'VERIFICADO', 'PENDIENTE', 'DESCUADRE'
        modoRegistro: 'MONTO',
        notaTesorero: 'Recibido completo y verificado en caja central.',
        solicitudBorrado: false,
        motivoBorrado: '',
        borradoAutorizado: false,
        solicitudEdicion: false,
        motivoEdicion: ''
      },
      {
        id: 'MOV-1002',
        tipo: 'EGRESO',
        fecha: '2026-11-03',
        actividad: 'Compra de gas y suministros de cocina',
        descripcion: 'Para el refrigerio de jóvenes del sábado.',
        responsable: 'Hno. Carlos Pérez',
        montoSalida: 95000,
        montoSobranteDevuelto: 5000,
        estado: 'VERIFICADO',
        notaTesorero: 'Sobrante de $5,000 devuelto a caja central.',
        solicitudBorrado: false,
        motivoBorrado: '',
        borradoAutorizado: false
      }
    ];
  });

  const [usuariosSistema, setUsuariosSistema] = useState(() => {
    const saved = localStorage.getItem('tesoreria_usuarios');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return [
      { id: 'u1', nombre: 'Hna. Marta Gómez', usuario: 'marta', clave: '1234', rol: 'RECAUDADOR', activo: true, solicitudClave: false },
      { id: 'u2', nombre: 'Hno. Esteban Ruiz', usuario: 'tesorero', clave: '5678', rol: 'TESORERO', activo: true, solicitudClave: false },
      { id: 'u3', nombre: 'Pastor Alberto Silva', usuario: 'admin', clave: 'admin', rol: 'ADMINISTRADOR', activo: true, solicitudClave: false }
    ];
  });

  const [configuracionApp, setConfiguracionApp] = useState(() => {
    const saved = localStorage.getItem('tesoreria_config');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return {
      titulo: 'Tesorería Central e Iglesia',
      subtitulo: 'Sistema de Control Financiero y Auditoría',
      logoUrl: ''
    };
  });

  // Estados de Cierres de Mes guardados
  const [cierresMensuales, setCierresMensuales] = useState(() => {
    const saved = localStorage.getItem('tesoreria_cierres');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return [];
  });

  // Estados de sesión actual
  const [usuarioLogueadoRecaudador, setUsuarioLogueadoRecaudador] = useState(usuariosSistema[0]);
  const [usuarioLogueadoTesorero, setUsuarioLogueadoTesorero] = useState(null);
  const [usuarioLogueadoAdmin, setUsuarioLogueadoAdmin] = useState(null);

  // Inputs de Login
  const [recUserLoginInput, setRecUserLoginInput] = useState('');
  const [recPassLoginInput, setRecPassLoginInput] = useState('');
  const [recLoginError, setRecLoginError] = useState('');

  const [tesUserLoginInput, setTesUserLoginInput] = useState('');
  const [tesPassLoginInput, setTesPassLoginInput] = useState('');
  const [tesLoginError, setTesLoginError] = useState('');

  const [adminUserLoginInput, setAdminUserLoginInput] = useState('');
  const [adminPassLoginInput, setAdminPassLoginInput] = useState('');
  const [adminLoginError, setAdminLoginError] = useState('');

  // Toast de notificaciones
  const [toastMessage, setToastMessage] = useState(null);
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const guardarEnNube = (nuevosMovs, nuevosUsers, nuevaConf, nuevosCierres = cierresMensuales) => {
    setMovimientos(nuevosMovs);
    setUsuariosSistema(nuevosUsers);
    setConfiguracionApp(nuevaConf);
    setCierresMensuales(nuevosCierres);
    localStorage.setItem('tesoreria_movimientos', JSON.stringify(nuevosMovs));
    localStorage.setItem('tesoreria_usuarios', JSON.stringify(nuevosUsers));
    localStorage.setItem('tesoreria_config', JSON.stringify(nuevaConf));
    localStorage.setItem('tesoreria_cierres', JSON.stringify(nuevosCierres));
  };

  // Formulario Recaudador (Ingresos / Unidades / Eventos)
  const [recFecha, setRecFecha] = useState(new Date().toISOString().split('T')[0]);
  const [recActividad, setRecActividad] = useState('');
  const [recDescripcion, setRecDescripcion] = useState('');
  const [recModoRegistro, setRecModoRegistro] = useState('MONTO'); // 'MONTO' o 'UNIDADES'
  const [recMontoReportado, setRecMontoReportado] = useState('');
  const [recMetodoPago, setRecMetodoPago] = useState('Efectivo');
  
  // Parámetros para modo Unidades / Eventos con compradores
  const [recPrecioUnitario, setRecPrecioUnitario] = useState('');
  const [recCantidadProducida, setRecCantidadProducida] = useState('');
  const [recCompradoresTemp, setRecCompradoresTemp] = useState([]);
  const [compradorNombreInput, setCompradorNombreInput] = useState('');
  const [compradorCantidadInput, setCompradorCantidadInput] = useState('');
  const [compradorEstadoPago, setCompradorEstadoPago] = useState('PAGADO'); // 'PAGADO', 'FIADO'

  // Modales varios
  const [solicitudBorradoModal, setSolicitudBorradoModal] = useState(null);
  const [motivoBorradoInput, setMotivoBorradoInput] = useState('');

  const [solicitudIncobrableModal, setSolicitudIncobrableModal] = useState(null); // {movimientoId, compradorId}
  const [motivoIncobrableInput, setMotivoIncobrableInput] = useState('');

  const [abonoModal, setAbonoModal] = useState(null); // {movimientoId, compradorId, saldoPendiente}
  const [valorAbonoInput, setValorAbonoInput] = useState('');

  const [arqueoItem, setArqueoItem] = useState(null);
  const [montoFisicoContado, setMontoFisicoContado] = useState('');

  const [editingTesoreroMov, setEditingTesoreroMov] = useState(null);
  const [solicitudEdicionModal, setSolicitudEdicionModal] = useState(null);
  const [motivoSolicitudEdicion, setMotivoSolicitudEdicion] = useState('');

  const [showOlvidoClaveModal, setShowOlvidoClaveModal] = useState(false);
  const [usuarioOlvidoInput, setUsuarioOlvidoInput] = useState('');
  const [showRestablecerClaveModal, setShowRestablecerClaveModal] = useState(false);
  const [usuarioRestablecerAlias, setUsuarioRestablecerAlias] = useState('');
  const [nuevaClaveInput, setNuevaClaveInput] = useState('');

  const [showCambioClaveRecaudadorModal, setShowCambioClaveRecaudadorModal] = useState(false);
  const [claveActualRecInput, setClaveActualRecInput] = useState('');
  const [claveNuevaRecInput, setClaveNuevaRecInput] = useState('');

  const [showCambioClaveTesoreroModal, setShowCambioClaveTesoreroModal] = useState(false);
  const [claveActualTesInput, setClaveActualTesInput] = useState('');
  const [claveNuevaTesInput, setClaveNuevaTesInput] = useState('');

  // Modales de Admin
  const [editingUser, setEditingUser] = useState(null);
  const [eliminarUsuarioModal, setEliminarUsuarioModal] = useState(null);
  const [showBorrarTodoModal, setShowBorrarTodoModal] = useState(false);
  const [eliminarItemModal, setEliminarItemModal] = useState(null);

  const [nuevoUserNombre, setNuevoUserNombre] = useState('');
  const [nuevoUserAlias, setNuevoUserAlias] = useState('');
  const [nuevoUserClave, setNuevoUserClave] = useState('');
  const [nuevoUserRol, setNuevoUserRol] = useState('RECAUDADOR');

  const [inputConfigTitulo, setInputConfigTitulo] = useState(configuracionApp.titulo);
  const [inputConfigLogo, setInputConfigLogo] = useState(configuracionApp.logoUrl);
  const [inputConfigSub, setInputConfigSub] = useState(configuracionApp.subtitulo);

  // Formulario Egreso Tesorero
  const [egrFecha, setEgrFecha] = useState(new Date().toISOString().split('T')[0]);
  const [egrCategoria, setEgrCategoria] = useState(CATEGORIAS_EGRESO[0]);
  const [egrConcepto, setEgrConcepto] = useState('');
  const [egrResponsable, setEgrResponsable] = useState('');
  const [egrMonto, setEgrMonto] = useState('');
  const [egrSobranteDevuelto, setEgrSobranteDevuelto] = useState('');
  const [egrNota, setEgrNota] = useState('');

  // Filtros de libro
  const [busquedaLibro, setBusquedaLibro] = useState('');
  const [filtroLibro, setFiltroLibro] = useState('TODOS');

  // Estado expansiones de filas de unidades
  const [expandedRows, setExpandedRows] = useState({});
  const toggleExpandRow = (id) => {
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // KPIs financieros en tiempo real
  const calcularResumenInventario = (m) => {
    if (m.modoRegistro !== 'UNIDADES' || !Array.isArray(m.compradores)) {
      return { esUnidades: false };
    }
    const precio = Number(m.precioUnitario) || 0;
    const producidas = Number(m.cantidadProducida) || 0;
    let vendidas = 0;
    let plataFiada = 0;
    let plataIncobrable = 0;
    let unidadesFiadas = 0;
    let unidadesIncobrables = 0;
    let unidadesPagadas = 0;

    m.compradores.forEach(c => {
      const cant = Number(c.cantidad) || 0;
      const totalComp = cant * precio;
      if (c.estadoPago === 'PAGADO') {
        vendidas += cant;
        unidadesPagadas += cant;
      } else if (c.estadoPago === 'FIADO') {
        vendidas += cant;
        unidadesFiadas += cant;
        const abono = Math.min(totalComp, Number(c.montoAbonado) || 0);
        plataFiada += Math.max(0, totalComp - abono);
      } else if (c.estadoPago === 'INCOBRABLE') {
        unidadesIncobrables += cant;
        plataIncobrable += totalComp;
      }
    });

    const sinVender = Math.max(0, producidas - vendidas);
    return {
      esUnidades: true,
      precioUnitario: precio,
      producidas,
      vendidas,
      sinVender,
      unidadesFiadas,
      unidadesIncobrables,
      unidadesPagadas,
      plataFiada,
      plataIncobrable,
      totalPotencial: producidas * precio
    };
  };

  const calcularKPIs = () => {
    let totalEntradasVerificadas = 0;
    let totalSalidas = 0;
    let pendientePorRecoger = 0;
    let totalCarteraYSinVender = 0;
    let descuadreAcumulado = 0;
    let cantidadPendientes = 0;
    let cantidadDescuadres = 0;
    let cantidadSolicitudesBorrado = 0;
    let cantidadSolicitudesEdicion = 0;
    let cantidadSolicitudesIncobrable = 0;

    movimientos.forEach(m => {
      if (m.solicitudBorrado && !m.borradoAutorizado) cantidadSolicitudesBorrado++;
      if (m.solicitudEdicion) cantidadSolicitudesEdicion++;
      if (m.modoRegistro === 'UNIDADES' && Array.isArray(m.compradores)) {
        m.compradores.forEach(c => {
          if (c.solicitudIncobrable) cantidadSolicitudesIncobrable++;
        });
      }

      if (m.tipo === 'INGRESO') {
        if (m.estado === 'VERIFICADO') {
          totalEntradasVerificadas += Number(m.montoRecibido) || Number(m.montoReportado) || 0;
        } else if (m.estado === 'PENDIENTE') {
          cantidadPendientes++;
          const tieneAbono = Number(m.ultimoAbonoReportado) > 0;
          pendientePorRecoger += tieneAbono ? Number(m.ultimoAbonoReportado) : (Number(m.montoReportado) || 0);
        } else if (m.estado === 'DESCUADRE') {
          cantidadDescuadres++;
          const diff = (Number(m.montoReportado) || 0) - (Number(m.montoRecibido) || 0);
          descuadreAcumulado += Math.abs(diff);
          totalEntradasVerificadas += Number(m.montoRecibido) || 0;
        }

        const inv = calcularResumenInventario(m);
        if (inv.esUnidades) {
          totalCarteraYSinVender += inv.plataFiada + (inv.sinVender * inv.precioUnitario);
        }
      } else if (m.tipo === 'EGRESO') {
        const salidaNeta = Math.max(0, (Number(m.montoSalida) || 0) - (Number(m.montoSobranteDevuelto) || 0));
        totalSalidas += salidaNeta;
      }
    });

    const saldoRealEnCaja = totalEntradasVerificadas - totalSalidas;

    return {
      totalEntradasVerificadas,
      totalSalidas,
      saldoRealEnCaja,
      pendientePorRecoger,
      totalCarteraYSinVender,
      descuadreAcumulado,
      cantidadPendientes,
      cantidadDescuadres,
      cantidadSolicitudesBorrado,
      cantidadSolicitudesEdicion,
      cantidadSolicitudesIncobrable
    };
  };

  const kpis = calcularKPIs();

  // Handlers de Login
  const handleRecaudadorLogin = (e) => {
    e.preventDefault();
    setRecLoginError('');
    const userFound = usuariosSistema.find(u => u.usuario === recUserLoginInput.trim() && u.rol === 'RECAUDADOR');
    if (!userFound || !userFound.activo) {
      setRecLoginError('Usuario recaudador no encontrado o inactivo.');
      return;
    }
    if (userFound.clave !== recPassLoginInput) {
      setRecLoginError('Contraseña incorrecta.');
      return;
    }
    setUsuarioLogueadoRecaudador(userFound);
    showToast(`¡Bienvenida, ${userFound.nombre}!`);
  };

  const handleTesoreroLogin = (e) => {
    e.preventDefault();
    setTesLoginError('');
    const userFound = usuariosSistema.find(u => u.usuario === tesUserLoginInput.trim() && u.rol === 'TESORERO');
    if (!userFound || !userFound.activo) {
      setTesLoginError('Usuario tesorero no encontrado o inactivo.');
      return;
    }
    if (userFound.clave !== tesPassLoginInput) {
      setTesLoginError('Contraseña incorrecta.');
      return;
    }
    setUsuarioLogueadoTesorero(userFound);
    showToast(`Sesión iniciada como Tesorero: ${userFound.nombre}`);
  };

  const handleAdminLogin = (e) => {
    e.preventDefault();
    setAdminLoginError('');
    const userFound = usuariosSistema.find(u => u.usuario === adminUserLoginInput.trim() && u.rol === 'ADMINISTRADOR');
    if (!userFound || !userFound.activo) {
      setAdminLoginError('Usuario administrador no encontrado o inactivo.');
      return;
    }
    if (userFound.clave !== adminPassLoginInput) {
      setAdminLoginError('Contraseña incorrecta.');
      return;
    }
    setUsuarioLogueadoAdmin(userFound);
    showToast(`¡Bienvenido, ${userFound.nombre}! (Pastor / Administrador)`);
  };

  // Funciones de Recaudador
  const handleAgregarCompradorTemp = (e) => {
    e.preventDefault();
    if (!compradorNombreInput.trim() || !compradorCantidadInput) return;
    const nuevoComp = {
      id: 'comp_' + Date.now() + Math.random().toString(36).substring(2, 5),
      nombre: compradorNombreInput.trim(),
      cantidad: Number(compradorCantidadInput) || 1,
      estadoPago: compradorEstadoPago, // 'PAGADO' o 'FIADO'
      montoAbonado: 0,
      solicitudIncobrable: false,
      motivoIncobrable: ''
    };
    setRecCompradoresTemp([...recCompradoresTemp, nuevoComp]);
    setCompradorNombreInput('');
    setCompradorCantidadInput('');
  };

  const handleQuitarCompradorTemp = (id) => {
    setRecCompradoresTemp(recCompradoresTemp.filter(c => c.id !== id));
  };

  const handleRegistrarRecaudo = (e) => {
    e.preventDefault();
    const responsableActual = usuarioLogueadoRecaudador ? usuarioLogueadoRecaudador.nombre : 'Recaudador';
    
    let montoTotalCalc = 0;
    if (recModoRegistro === 'UNIDADES') {
      const precio = Number(recPrecioUnitario) || 0;
      recCompradoresTemp.forEach(c => {
        if (c.estadoPago === 'PAGADO') {
          montoTotalCalc += c.cantidad * precio;
        } else if (c.estadoPago === 'FIADO') {
          montoTotalCalc += Number(c.montoAbonado) || 0;
        }
      });
    } else {
      montoTotalCalc = Number(recMontoReportado) || 0;
    }

    const nuevoMov = {
      id: 'MOV-' + Math.floor(1000 + Math.random() * 9000),
      tipo: 'INGRESO',
      fecha: recFecha,
      actividad: recActividad,
      descripcion: recDescripcion || 'Ingreso registrado por recaudador',
      responsable: responsableActual,
      metodoPago: recMetodoPago,
      montoReportado: montoTotalCalc,
      montoRecibido: 0, // Pendiente de arqueo por tesorería
      estado: 'PENDIENTE',
      modoRegistro: recModoRegistro,
      precioUnitario: Number(recPrecioUnitario) || 0,
      cantidadProducida: Number(recCantidadProducida) || 0,
      compradores: recCompradoresTemp,
      solicitudBorrado: false,
      motivoBorrado: '',
      borradoAutorizado: false,
      solicitudEdicion: false,
      motivoEdicion: ''
    };

    const actualizados = [nuevoMov, ...movimientos];
    guardarEnNube(actualizados, usuariosSistema, configuracionApp);

    // Reset formulario
    setRecActividad('');
    setRecDescripcion('');
    setRecMontoReportado('');
    setRecPrecioUnitario('');
    setRecCantidadProducida('');
    setRecCompradoresTemp([]);
    showToast('¡Recaudo enviado a Tesorería con éxito!');
    setRecaudadorTab('MIS_MOVIMIENTOS');
  };

  const handleEnviarSolicitudEdicion = (e) => {
    e.preventDefault();
    if (!solicitudEdicionModal) return;
    const actualizados = movimientos.map(m => {
      if (m.id === solicitudEdicionModal.id) {
        return {
          ...m,
          solicitudEdicion: true,
          motivoEdicion: motivoSolicitudEdicion
        };
      }
      return m;
    });
    guardarEnNube(actualizados, usuariosSistema, configuracionApp);
    setSolicitudEdicionModal(null);
    setMotivoSolicitudEdicion('');
    showToast('Solicitud de edición enviada a Tesorería.');
  };

  const handleSaldarTodoComprador = (movId, compradorId) => {
    const actualizados = movimientos.map(m => {
      if (m.id === movId && Array.isArray(m.compradores)) {
        const nuevosComps = m.compradores.map(c => {
          if (c.id === compradorId) {
            return { ...c, estadoPago: 'PAGADO', montoAbonado: c.cantidad * m.precioUnitario };
          }
          return c;
        });
        return { ...m, compradores: nuevosComps };
      }
      return m;
    });
    guardarEnNube(actualizados, usuariosSistema, configuracionApp);
    showToast('¡Deuda saldada por completo!');
  };

  const openAbonoModal = (item, comprador) => {
    const totalComp = comprador.cantidad * item.precioUnitario;
    const abonoPrevio = Number(comprador.montoAbonado) || 0;
    const saldoPend = Math.max(0, totalComp - abonoPrevio);
    setAbonoModal({ movimientoId: item.id, compradorId: comprador.id, saldoPendiente: saldoPend });
    setValorAbonoInput('');
  };

  const handleConfirmarAbono = (e) => {
    e.preventDefault();
    if (!abonoModal) return;
    const valorAbono = Number(valorAbonoInput) || 0;
    const actualizados = movimientos.map(m => {
      if (m.id === abonoModal.movimientoId && Array.isArray(m.compradores)) {
        let sumaTotalAbonosNuevos = 0;
        const nuevosComps = m.compradores.map(c => {
          if (c.id === abonoModal.compradorId) {
            const nuevoAbonoTotal = (Number(c.montoAbonado) || 0) + valorAbono;
            const totalComp = c.cantidad * m.precioUnitario;
            const esPagadoTotal = nuevoAbonoTotal >= totalComp;
            return {
              ...c,
              montoAbonado: nuevoAbonoTotal,
              estadoPago: esPagadoTotal ? 'PAGADO' : c.estadoPago
            };
          }
          return c;
        });

        // Calcular nuevo monto reportado para avisar a tesorería
        nuevosComps.forEach(c => {
          const totalC = c.cantidad * m.precioUnitario;
          if (c.estadoPago === 'PAGADO') sumaTotalAbonosNuevos += totalC;
          else if (c.estadoPago === 'FIADO') sumaTotalAbonosNuevos += Number(c.montoAbonado) || 0;
        });

        return {
          ...m,
          compradores: nuevosComps,
          montoReportado: sumaTotalAbonosNuevos,
          ultimoAbonoReportado: valorAbono
        };
      }
      return m;
    });

    guardarEnNube(actualizados, usuariosSistema, configuracionApp);
    setAbonoModal(null);
    showToast('Abono registrado. Tesorería ha sido notificada.');
  };

  const handleEnviarSolicitudIncobrable = (e) => {
    e.preventDefault();
    if (!solicitudIncobrableModal) return;
    const { movimientoId, compradorId } = solicitudIncobrableModal;
    const actualizados = movimientos.map(m => {
      if (m.id === movimientoId && Array.isArray(m.compradores)) {
        const nuevosComps = m.compradores.map(c => {
          if (c.id === compradorId) {
            return {
              ...c,
              solicitudIncobrable: true,
              motivoIncobrable: motivoIncobrableInput
            };
          }
          return c;
        });
        return { ...m, compradores: nuevosComps };
      }
      return m;
    });
    guardarEnNube(actualizados, usuariosSistema, configuracionApp);
    setSolicitudIncobrableModal(null);
    setMotivoIncobrableInput('');
    showToast('Solicitud enviada a Tesorería para dar de baja.');
  };

  // Funciones de Tesorería
  const openArqueoModal = (item) => {
    setArqueoItem(item);
    setMontoFisicoContado(item.montoReportado || '');
  };

  const handleConfirmarArqueo = (e) => {
    e.preventDefault();
    if (!arqueoItem) return;
    const fisico = Number(montoFisicoContado) || 0;
    const reportado = Number(arqueoItem.montoReportado) || 0;
    let nuevoEstado = 'VERIFICADO';
    let notaT = arqueoItem.notaTesorero || '';

    if (fisico !== reportado) {
      nuevoEstado = 'DESCUADRE';
      const diff = reportado - fisico;
      notaT = `[Descuadre de arqueo: Se reportó ${formatCOP(reportado)} y físicamente hay ${formatCOP(fisico)}. Faltan ${formatCOP(diff)}]`;
    } else {
      notaT = `Arqueo verificado y recibido conforme: ${formatCOP(fisico)}`;
    }

    const actualizados = movimientos.map(m => {
      if (m.id === arqueoItem.id) {
        return {
          ...m,
          montoRecibido: fisico,
          estado: nuevoEstado,
          notaTesorero: notaT,
          ultimoAbonoReportado: 0
        };
      }
      return m;
    });

    guardarEnNube(actualizados, usuariosSistema, configuracionApp);
    setArqueoItem(null);
    showToast(nuevoEstado === 'VERIFICADO' ? '¡Arqueo verificado con éxito!' : '¡Atención! Se registró un descuadre en el arqueo.');
  };

  const handleCerrarRecaudoSinMasNovedad = (item) => {
    const actualizados = movimientos.map(m => {
      if (m.id === item.id) {
        return {
          ...m,
          montoRecibido: m.montoReportado,
          estado: 'VERIFICADO',
          notaTesorero: 'Cerrado y recibido conforme por Tesorería.',
          ultimoAbonoReportado: 0
        };
      }
      return m;
    });
    guardarEnNube(actualizados, usuariosSistema, configuracionApp);
    showToast('Recaudo cerrado y verificado en caja.');
  };

  const handleAprobarAjusteDescuadre = (item) => {
    const actualizados = movimientos.map(m => {
      if (m.id === item.id) {
        return {
          ...m,
          estado: 'VERIFICADO',
          notaTesorero: `${m.notaTesorero} — [Ajuste de descuadre aprobado y cerrado por Tesorería]`
        };
      }
      return m;
    });
    guardarEnNube(actualizados, usuariosSistema, configuracionApp);
    showToast('Descuadre ajustado y cerrado.');
  };

  const handleRegistrarEgreso = (e) => {
    e.preventDefault();
    const nombreTesorero = usuarioLogueadoTesorero ? usuarioLogueadoTesorero.nombre : 'Tesorero';
    const montoEgr = Number(egrMonto) || 0;
    const sobrante = Number(egrSobranteDevuelto) || 0;

    const nuevoEgreso = {
      id: 'EGR-' + Math.floor(1000 + Math.random() * 9000),
      tipo: 'EGRESO',
      fecha: egrFecha,
      actividad: `[${egrCategoria}] ${egrConcepto}`,
      descripcion: egrNota ? `Nota: ${egrNota}` : 'Gasto autorizado',
      responsable: egrResponsable,
      montoSalida: montoEgr,
      montoSobranteDevuelto: sobrante,
      estado: 'VERIFICADO',
      notaTesorero: `Autorizado por Tesorería (${nombreTesorero}). Sobrante devuelto a caja: ${formatCOP(sobrante)}`,
      solicitudBorrado: false,
      borradoAutorizado: false
    };

    const actualizados = [nuevoEgreso, ...movimientos];
    guardarEnNube(actualizados, usuariosSistema, configuracionApp);

    setEgrConcepto('');
    setEgrResponsable('');
    setEgrMonto('');
    setEgrSobranteDevuelto('');
    setEgrNota('');
    showToast('Salida de dinero y devolución de sobrante registradas en caja.');
    setTesoreroTab('LIBRO');
  };

  const handleTesoreroResolverIncobrable = (movId, compId, aprobar) => {
    const actualizados = movimientos.map(m => {
      if (m.id === movId && Array.isArray(m.compradores)) {
        let sumaTotalReportado = 0;
        const nuevosComps = m.compradores.map(c => {
          if (c.id === compId) {
            return {
              ...c,
              estadoPago: aprobar ? 'INCOBRABLE' : 'FIADO',
              solicitudIncobrable: false
            };
          }
          return c;
        });

        nuevosComps.forEach(c => {
          const totalC = c.cantidad * m.precioUnitario;
          if (c.estadoPago === 'PAGADO') sumaTotalReportado += totalC;
          else if (c.estadoPago === 'FIADO') sumaTotalReportado += Number(c.montoAbonado) || 0;
        });

        return {
          ...m,
          compradores: nuevosComps,
          montoReportado: sumaTotalReportado
        };
      }
      return m;
    });

    guardarEnNube(actualizados, usuariosSistema, configuracionApp);
    showToast(aprobar ? 'Deuda dada de baja como Incobrable.' : 'Solicitud de incobrable rechazada.');
  };

  const handleAutorizarEdicionTesorero = (item, aprobar) => {
    const actualizados = movimientos.map(m => {
      if (m.id === item.id) {
        return {
          ...m,
          solicitudEdicion: false,
          notaTesorero: aprobar ? `${m.notaTesorero || ''} [Edición autorizada]` : `${m.notaTesorero || ''} [Edición rechazada]`
        };
      }
      return m;
    });
    guardarEnNube(actualizados, usuariosSistema, configuracionApp);
    showToast(aprobar ? 'Edición autorizada.' : 'Edición rechazada.');
  };

  // CONTROL ESTRICTO DE BORRADO: Solicitud enviada por Tesorería al Pastor/Admin
  const handleEnviarSolicitudBorrado = (e) => {
    e.preventDefault();
    if (!solicitudBorradoModal) return;
    const actualizados = movimientos.map(m => {
      if (m.id === solicitudBorradoModal.id) {
        return {
          ...m,
          solicitudBorrado: true,
          motivoBorrado: motivoBorradoInput,
          solicitanteBorrado: usuarioLogueadoTesorero ? usuarioLogueadoTesorero.nombre : 'Tesorería'
        };
      }
      return m;
    });
    guardarEnNube(actualizados, usuariosSistema, configuracionApp);
    setSolicitudBorradoModal(null);
    setMotivoBorradoInput('');
    showToast('Solicitud de borrado enviada al Pastor / Administrador.');
  };

  // Pastor / Admin resuelve solicitud de borrado
  const handleResolverBorradoAdmin = (item, autorizar) => {
    const actualizados = movimientos.map(m => {
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
    guardarEnNube(actualizados, usuariosSistema, configuracionApp);
    showToast(autorizar ? 'Borrado autorizado. El tesorero ya puede eliminarlo.' : 'Solicitud de borrado denegada.');
  };

  const handleEliminarRegistroLibro = () => {
    if (!eliminarItemModal) return;
    const actualizados = movimientos.filter(m => m.id !== eliminarItemModal.id);
    guardarEnNube(actualizados, usuariosSistema, configuracionApp);
    setEliminarItemModal(null);
    showToast('Registro eliminado definitivamente del libro.');
  };

  // Funciones de Admin / Pastor
  const handleCrearUsuarioSistema = (e) => {
    e.preventDefault();
    if (!nuevoUserNombre.trim() || !nuevoUserAlias.trim() || !nuevoUserClave.trim()) return;
    const nuevoU = {
      id: 'u_' + Date.now(),
      nombre: nuevoUserNombre.trim(),
      usuario: nuevoUserAlias.trim(),
      clave: nuevoUserClave.trim(),
      rol: nuevoUserRol,
      activo: true,
      solicitudClave: false
    };
    const actualizados = [...usuariosSistema, nuevoU];
    guardarEnNube(movimientos, actualizados, configuracionApp);
    setNuevoUserNombre('');
    setNuevoUserAlias('');
    setNuevoUserClave('');
    showToast('¡Nuevo usuario registrado con éxito!');
  };

  const handleToggleEstadoUsuario = (id) => {
    const actualizados = usuariosSistema.map(u => u.id === id ? { ...u, activo: !u.activo } : u);
    guardarEnNube(movimientos, actualizados, configuracionApp);
    showToast('Estado de usuario actualizado.');
  };

  const handleGuardarEdicionUsuario = (e) => {
    e.preventDefault();
    if (!editingUser) return;
    const actualizados = usuariosSistema.map(u => u.id === editingUser.id ? editingUser : u);
    guardarEnNube(movimientos, actualizados, configuracionApp);
    setEditingUser(null);
    showToast('Usuario modificado correctamente.');
  };

  const handleConfirmarEliminarUsuario = () => {
    if (!eliminarUsuarioModal) return;
    const actualizados = usuariosSistema.filter(u => u.id !== eliminarUsuarioModal.id);
    guardarEnNube(movimientos, actualizados, configuracionApp);
    setEliminarUsuarioModal(null);
    showToast('Usuario eliminado del sistema.');
  };

  const handleGuardarConfiguracionAdmin = (e) => {
    e.preventDefault();
    const nuevaConf = {
      titulo: inputConfigTitulo,
      subtitulo: inputConfigSub,
      logoUrl: inputConfigLogo
    };
    guardarEnNube(movimientos, usuariosSistema, nuevaConf);
    showToast('Configuración de identidad actualizada.');
  };

  const handleBorrarTodo = () => {
    guardarEnNube([], usuariosSistema, configuracionApp, []);
    setShowBorrarTodoModal(false);
    showToast('Base de datos reiniciada por completo.');
  };

  const handleExportCSV = () => {
    let csv = 'ID,Tipo,Fecha,Actividad,Descripcion,Responsable,MontoReportado,MontoRecibido/Salida,Estado,Nota\n';
    movimientos.forEach(m => {
      const monto = m.tipo === 'INGRESO' ? (m.montoRecibido || m.montoReportado) : (m.montoSalida || 0);
      csv += `"${m.id}","${m.tipo}","${m.fecha}","${m.actividad}","${m.descripcion}","${m.responsable}",${m.montoReportado || 0},${m},"${m.estado}","${m.notaTesorero || ''}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Libro_Tesoreria_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    showToast('Archivo Excel/CSV descargado correctamente.');
  };

  // Recuperación de claves
  const handleEnviarSolicitudClave = (e) => {
    e.preventDefault();
    const actualizados = usuariosSistema.map(u => u.usuario === usuarioOlvidoInput.trim() ? { ...u, solicitudClave: true } : u);
    guardarEnNube(movimientos, actualizados, configuracionApp);
    setShowOlvidoClaveModal(false);
    setUsuarioOlvidoInput('');
    showToast('Solicitud de cambio de clave enviada al Pastor / Administrador.');
  };

  const handleAutorizarCambioClave = (userId, aprobar) => {
    const actualizados = usuariosSistema.map(u => {
      if (u.id === userId) {
        return {
          ...u,
          solicitudClave: false,
          clave: aprobar ? '1234' : u.clave // Clave temporal por defecto
        };
      }
      return u;
    });
    guardarEnNube(movimientos, actualizados, configuracionApp);
    showToast(aprobar ? 'Clave restablecida temporalmente a "1234".' : 'Solicitud rechazada.');
  };

  const handleRestablecerClaveConAutorizacion = (e) => {
    e.preventDefault();
    const actualizados = usuariosSistema.map(u => {
      if (u.usuario === usuarioRestablecerAlias.trim()) {
        return { ...u, clave: nuevaClaveInput, solicitudClave: false };
      }
      return u;
    });
    guardarEnNube(movimientos, actualizados, configuracionApp);
    setShowRestablecerClaveModal(false);
    setUsuarioRestablecerAlias('');
    setNuevaClaveInput('');
    showToast('¡Contraseña actualizada con éxito!');
  };

  const handleCambiarClavePropiaRecaudador = (e) => {
    e.preventDefault();
    if (!usuarioLogueadoRecaudador) return;
    if (usuarioLogueadoRecaudador.clave !== claveActualRecInput) {
      showToast('La contraseña actual no es correcta.');
      return;
    }
    const actualizados = usuariosSistema.map(u => u.id === usuarioLogueadoRecaudador.id ? { ...u, clave: claveNuevaRecInput } : u);
    guardarEnNube(movimientos, actualizados, configuracionApp);
    setUsuarioLogueadoRecaudador({ ...usuarioLogueadoRecaudador, clave: claveNuevaRecInput });
    setShowCambioClaveRecaudadorModal(false);
    setClaveActualRecInput('');
    setClaveNuevaRecInput('');
    showToast('¡Tu contraseña ha sido actualizada!');
  };

  const handleCambiarClavePropiaTesorero = (e) => {
    e.preventDefault();
    if (!usuarioLogueadoTesorero) return;
    if (usuarioLogueadoTesorero.clave !== claveActualTesInput) {
      showToast('La contraseña actual no es correcta.');
      return;
    }
    const actualizados = usuariosSistema.map(u => u.id === usuarioLogueadoTesorero.id ? { ...u, clave: claveNuevaTesInput } : u);
    guardarEnNube(movimientos, actualizados, configuracionApp);
    setUsuarioLogueadoTesorero({ ...usuarioLogueadoTesorero, clave: claveNuevaTesInput });
    setShowCambioClaveTesoreroModal(false);
    setClaveActualTesInput('');
    setClaveNuevaTesInput('');
    showToast('¡Tu contraseña de tesorero ha sido actualizada!');
  };

  // Función para ejecutar el Cierre de Mes (Admin / Tesorería)
  const [mesCierreInput, setMesCierreInput] = useState(new Date().toISOString().substring(0, 7)); // 'YYYY-MM'
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
      responsableCierre: usuarioLogueadoAdmin ? usuarioLogueadoAdmin.nombre : (usuarioLogueadoTesorero ? usuarioLogueadoTesorero.nombre : 'Administración'),
      totalEntradas: entradasMes,
      totalSalidas: salidasMes,
      balanceNeto: entradasMes - salidasMes,
      cantidadMovimientos: movsDelMes.length,
      sadoCajaFinal: kpis.saldoRealEnCaja
    };

    // Verificar si ya existe el cierre de ese mes
    const sinDuplicados = cierresMensuales.filter(c => c.mes !== mesCierreInput);
    const actualizadosCierres = [nuevoCierre, ...sinDuplicados];
    
    guardarEnNube(movimientos, usuariosSistema, configuracionApp, actualizadosCierres);
    showToast(`¡Cierre del mes ${mesCierreInput} ejecutado y sellado con éxito!`);
  };

  // Filtrado de movimientos en el libro
  const movimientosFiltrados = movimientos.filter(m => {
    const cumpleBusqueda = busquedaLibro === '' || 
      m.actividad.toLowerCase().includes(busquedaLibro.toLowerCase()) || 
      m.responsable.toLowerCase().includes(busquedaLibro.toLowerCase()) ||
      m.id.toLowerCase().includes(busquedaLibro.toLowerCase());
    
    if (!cumpleBusqueda) return false;

    if (filtroLibro === 'VERIFICADO') return m.estado === 'VERIFICADO';
    if (filtroLibro === 'PENDIENTE') return m.estado === 'PENDIENTE';
    if (filtroLibro === 'DESCUADRE') return m.estado === 'DESCUADRE';
    if (filtroLibro === 'INGRESOS') return m.tipo === 'INGRESO';
    if (filtroLibro === 'EGRESOS') return m.tipo === 'EGRESO';
    return true;
  });

  const renderEstadoBadge = (m) => {
    if (m.estado === 'VERIFICADO') {
      return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">Verificado ✓</span>;
    }
    if (m.estado === 'PENDIENTE') {
      return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900">Pendiente ⌛</span>;
    }
    if (m.estado === 'DESCUADRE') {
      return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800">Descuadre ⚠</span>;
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 font-sans pb-16">
      {/* Toast Notificación */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-indigo-950 text-white px-5 py-3 rounded-2xl shadow-xl border border-indigo-800 flex items-center gap-3 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Header Institucional */}
      <header className="bg-indigo-950 text-white shadow-lg border-b border-indigo-900">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            {configuracionApp.logoUrl ? (
              <img src={configuracionApp.logoUrl} alt="Logo" className="w-11 h-11 object-cover rounded-xl shadow-inner" />
            ) : (
              <div className="w-11 h-11 rounded-xl bg-indigo-900 border border-indigo-700 flex items-center justify-center shadow-inner">
                <Wallet className="w-6 h-6 text-emerald-400" />
              </div>
            )}
            <div>
              <h1 className="text-lg font-extrabold tracking-tight">{configuracionApp.titulo}</h1>
              <p className="text-xs text-indigo-300">{configuracionApp.subtitulo}</p>
            </div>
          </div>

          {/* Selector de Roles */}
          <div className="flex items-center gap-1.5 bg-indigo-900/80 p-1.5 rounded-2xl border border-indigo-800 shadow-inner">
            <button
              onClick={() => setActiveRole('RECAUDADOR')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeRole === 'RECAUDADOR' ? 'bg-white text-indigo-950 shadow-md' : 'text-indigo-200 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Recaudador</span>
            </button>
            <button
              onClick={() => setActiveRole('TESORERO')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeRole === 'TESORERO' ? 'bg-white text-indigo-950 shadow-md' : 'text-indigo-200 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Tesorería Central</span>
              {(kpis.cantidadPendientes + kpis.cantidadDescuadres + kpis.cantidadSolicitudesIncobrable) > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
              )}
            </button>
            <button
              onClick={() => setActiveRole('ADMINISTRADOR')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeRole === 'ADMINISTRADOR' ? 'bg-amber-500 text-indigo-950 shadow-md font-extrabold' : 'text-indigo-200 hover:text-white'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Pastor / Admin</span>
              {(kpis.cantidadSolicitudesBorrado > 0) && (
                <span className="px-1.5 py-0.2 rounded-full bg-rose-600 text-white text-[10px] font-extrabold animate-pulse">
                  {kpis.cantidadSolicitudesBorrado}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Contenido Principal según el Rol */}
      <main className="max-w-7xl mx-auto px-4 mt-6">
        {activeRole === 'RECAUDADOR' && (
          <>
            {!usuarioLogueadoRecaudador ? (
              <div className="max-w-md mx-auto mt-16 bg-white rounded-2xl shadow-xl border border-slate-200 p-8 text-center">
                <div className="w-14 h-14 bg-indigo-50 text-indigo-900 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
                  <Users className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Ingreso Recaudador</h2>
                <p className="text-sm text-slate-500 mt-1">Selecciona o ingresa tu usuario para registrar tus aportes.</p>

                <form onSubmit={handleRecaudadorLogin} className="mt-6 space-y-4 text-left">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Usuario Recaudador</label>
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
                    <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Contraseña</label>
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
                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-indigo-950 hover:bg-indigo-900 text-white font-bold text-sm shadow-md transition-all mt-2"
                  >
                    Ingresar
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
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-900 text-xs font-bold transition-all"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      Cambiar mi Contraseña
                    </button>
                    <button
                      onClick={() => setUsuarioLogueadoRecaudador(null)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition-all"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      Cerrar Sesión
                    </button>
                  </div>
                </div>

                <div className="flex gap-2 border-b border-slate-200 pb-2">
                  <button
                    onClick={() => setRecaudadorTab('REGISTRO')}
                    className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                      recaudadorTab === 'REGISTRO' ? 'bg-indigo-950 text-white shadow-xs' : 'bg-white text-slate-600 border hover:bg-slate-50'
                    }`}
                  >
                    <Calculator className="w-4 h-4" />
                    <span>Nuevo Registro de Recaudo</span>
                  </button>
                  <button
                    onClick={() => setRecaudadorTab('MIS_MOVIMIENTOS')}
                    className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                      recaudadorTab === 'MIS_MOVIMIENTOS' ? 'bg-indigo-950 text-white shadow-xs' : 'bg-white text-slate-600 border hover:bg-slate-50'
                    }`}
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>Mis Recaudos y Estado</span>
                  </button>
                </div>

                {recaudadorTab === 'REGISTRO' && (
                  <div className="max-w-3xl bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="bg-indigo-950 px-6 py-4 text-white">
                      <h2 className="font-bold text-base flex items-center gap-2">
                        <Calculator className="w-5 h-5 text-emerald-400" />
                        Registrar Nuevo Recaudo
                      </h2>
                      <p className="text-xs text-indigo-200 mt-0.5">Responsable: <strong className="text-white">{usuarioLogueadoRecaudador.nombre}</strong></p>
                    </div>

                    <form onSubmit={handleRegistrarRecaudo} className="p-6 space-y-5">
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
                          <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Método de Pago</label>
                          <select
                            value={recMetodoPago}
                            onChange={(e) => setRecMetodoPago(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white font-medium"
                          >
                            <option value="Efectivo">Efectivo</option>
                            <option value="Transferencia Bancaria">Transferencia Bancaria</option>
                            <option value="Datáfono">Datáfono</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Nombre de la Actividad o Concepto</label>
                        <input
                          type="text"
                          required
                          placeholder="Ej. Diezmos dominicales, Venta de tamales, Ofrenda especial..."
                          value={recActividad}
                          onChange={(e) => setRecActividad(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white font-medium"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Descripción / Observaciones</label>
                        <input
                          type="text"
                          placeholder="Detalles adicionales opcionales..."
                          value={recDescripcion}
                          onChange={(e) => setRecDescripcion(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white"
                        />
                      </div>

                      {/* Selector de Modo de Registro */}
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                        <label className="block text-xs font-bold uppercase text-slate-700">Modalidad de Recaudo</label>
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            type="button"
                            onClick={() => setRecModoRegistro('MONTO')}
                            className={`py-3 px-4 rounded-xl text-xs font-bold transition-all border ${
                              recModoRegistro === 'MONTO' ? 'bg-indigo-950 text-white border-indigo-950 shadow-sm' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                            }`}
                          >
                            💵 Ingreso Directo por Monto ($)
                          </button>
                          <button
                            type="button"
                            onClick={() => setRecModoRegistro('UNIDADES')}
                            className={`py-3 px-4 rounded-xl text-xs font-bold transition-all border ${
                              recModoRegistro === 'UNIDADES' ? 'bg-indigo-950 text-white border-indigo-950 shadow-sm' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                            }`}
                          >
                            🏷️ Control de Unidades / Artículos (Fiados / Pagados)
                          </button>
                        </div>
                      </div>

                      {recModoRegistro === 'MONTO' ? (
                        <div>
                          <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Monto Total a Recaudar ($)</label>
                          <input
                            type="number"
                            min="100"
                            step="100"
                            required
                            placeholder="Ej. 350000"
                            value={recMontoReportado}
                            onChange={(e) => setRecMontoReportado(e.target.value)}
                            className="w-full px-3.5 py-3 rounded-xl border border-slate-300 text-base font-extrabold text-emerald-800 bg-emerald-50/40"
                          />
                        </div>
                      ) : (
                        <div className="space-y-4 bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Precio Unitario ($)</label>
                              <input
                                type="number"
                                min="100"
                                step="100"
                                required
                                placeholder="Ej. 15000"
                                value={recPrecioUnitario}
                                onChange={(e) => setRecPrecioUnitario(e.target.value)}
                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold bg-white"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Total Producidas / Preparadas</label>
                              <input
                                type="number"
                                min="1"
                                required
                                placeholder="Ej. 50"
                                value={recCantidadProducida}
                                onChange={(e) => setRecCantidadProducida(e.target.value)}
                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold bg-white"
                              />
                            </div>
                          </div>

                          <div className="border-t border-indigo-200 pt-3">
                            <h3 className="font-bold text-xs uppercase text-indigo-950 mb-2">Lista de Compradores (Pagados o Fiados)</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 mb-3">
                              <input
                                type="text"
                                placeholder="Nombre comprador..."
                                value={compradorNombreInput}
                                onChange={(e) => setCompradorNombreInput(e.target.value)}
                                className="sm:col-span-2 px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white"
                              />
                              <input
                                type="number"
                                min="1"
                                placeholder="Cant."
                                value={compradorCantidadInput}
                                onChange={(e) => setCompradorCantidadInput(e.target.value)}
                                className="px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white"
                              />
                              <select
                                value={compradorEstadoPago}
                                onChange={(e) => setCompradorEstadoPago(e.target.value)}
                                className="px-3 py-2 rounded-lg border border-slate-300 text-xs font-bold bg-white"
                              >
                                <option value="PAGADO">Pagado ✓</option>
                                <option value="FIADO">Fiado ⌛</option>
                              </select>
                            </div>
                            <button
                              type="button"
                              onClick={handleAgregarCompradorTemp}
                              className="px-4 py-2 bg-indigo-950 text-white rounded-lg text-xs font-bold shadow-xs hover:bg-indigo-900 transition-all"
                            >
                              + Agregar Comprador a la Lista
                            </button>

                            {recCompradoresTemp.length > 0 && (
                              <div className="mt-3 bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 p-2">
                                {recCompradoresTemp.map((c) => {
                                  const totalC = c.cantidad * (Number(recPrecioUnitario) || 0);
                                  return (
                                    <div key={c.id} className="py-2 px-2 flex items-center justify-between text-xs">
                                      <div>
                                        <span className="font-bold text-slate-800">{c.nombre}</span>
                                        <span className="text-slate-500 ml-1">({c.cantidad} unid. • {formatCOP(totalC)})</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${c.estadoPago === 'PAGADO' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                                          {c.estadoPago}
                                        </span>
                                        <button type="button" onClick={() => handleQuitarCompradorTemp(c.id)} className="text-rose-600 font-bold hover:underline">✕</button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      <button
                        type="submit"
                        className="w-full py-3.5 rounded-xl bg-indigo-950 hover:bg-indigo-900 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
                      >
                        <Calculator className="w-4 h-4" />
                        Enviar Recaudo a Tesorería Central
                      </button>
                    </form>
                  </div>
                )}

                {recaudadorTab === 'MIS_MOVIMIENTOS' && (
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
                    <h2 className="font-bold text-base text-slate-900">Mis Movimientos Registrados</h2>
                    <div className="space-y-3">
                      {movimientos.filter(m => m.responsable === usuarioLogueadoRecaudador.nombre).length === 0 ? (
                        <p className="text-sm text-slate-500 py-10 text-center">No has registrado recaudos todavía.</p>
                      ) : (
                        movimientos
                          .filter(m => m.responsable === usuarioLogueadoRecaudador.nombre)
                          .map(item => {
                            const inv = calcularResumenInventario(item);
                            return (
                              <div key={item.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-mono font-bold text-indigo-900 bg-indigo-100 px-2 py-0.5 rounded">{item.id}</span>
                                      <span className="text-xs text-slate-500">{item.fecha}</span>
                                    </div>
                                    <h3 className="font-bold text-slate-900 text-sm mt-1">{item.actividad}</h3>
                                    <p className="text-xs text-slate-600">{item.descripcion}</p>
                                  </div>
                                  <div className="text-right">
                                    <span className="font-extrabold text-slate-900 text-sm block">{formatCOP(item.montoReportado)}</span>
                                    {renderEstadoBadge(item)}
                                  </div>
                                </div>

                                {item.notaTesorero && (
                                  <p className="text-xs bg-indigo-50 p-2.5 rounded-lg border border-indigo-100 text-indigo-900 font-medium">
                                    <strong>Nota de Tesorería:</strong> {item.notaTesorero}
                                  </p>
                                )}

                                {inv.esUnidades && (
                                  <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2 text-xs">
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center font-bold">
                                      <div className="bg-slate-50 p-2 rounded-lg">
                                        <span className="text-slate-500 block text-[10px]">Producidas</span>
                                        <span>{inv.producidas}</span>
                                      </div>
                                      <div className="bg-emerald-50 p-2 rounded-lg text-emerald-900">
                                        <span className="text-emerald-700 block text-[10px]">Vendidas / Pagadas</span>
                                        <span>{inv.vendidas}</span>
                                      </div>
                                      <div className="bg-indigo-50 p-2 rounded-lg text-indigo-900">
                                        <span className="text-indigo-700 block text-[10px]">Sin Vender</span>
                                        <span>{inv.sinVender}</span>
                                      </div>
                                      <div className="bg-amber-50 p-2 rounded-lg text-amber-900">
                                        <span className="text-amber-800 block text-[10px]">Fiado en Calle</span>
                                        <span>{formatCOP(inv.plataFiada)}</span>
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
                                          {expandedRows[item.id] ? 'Ocultar lista de compradores y deudores' : `Ver compradores y deudores (${item.compradores.length})`}
                                        </button>

                                        {expandedRows[item.id] && (
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
                )}
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
                    <span className="text-[11px] font-bold uppercase text-slate-500 block">Total Entradas</span>
                    <p className="text-lg font-extrabold text-slate-900 mt-2">{formatCOP(kpis.totalEntradasVerificadas)}</p>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                    <span className="text-[11px] font-bold uppercase text-slate-500 block">Total Salidas</span>
                    <p className="text-lg font-extrabold text-rose-600 mt-2">- {formatCOP(kpis.totalSalidas)}</p>
                  </div>
                  <div className="bg-indigo-950 p-4 rounded-2xl shadow-md text-white">
                    <span className="text-[11px] font-bold uppercase text-indigo-200 block">Saldo en Caja</span>
                    <p className="text-xl font-extrabold text-emerald-400 mt-2">{formatCOP(kpis.saldoRealEnCaja)}</p>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-sm">
                    <span className="text-[11px] font-bold uppercase text-amber-800 block">Pendiente Recoger</span>
                    <p className="text-lg font-extrabold text-amber-700 mt-2">{formatCOP(kpis.pendientePorRecoger)}</p>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-indigo-200 shadow-sm">
                    <span className="text-[11px] font-bold uppercase text-indigo-900 block">Cartera / En Calle</span>
                    <p className="text-lg font-extrabold text-indigo-900 mt-2">{formatCOP(kpis.totalCarteraYSinVender)}</p>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-rose-200 shadow-sm">
                    <span className="text-[11px] font-bold uppercase text-rose-800 block">Descuadre</span>
                    <p className="text-lg font-extrabold text-rose-700 mt-2">{formatCOP(kpis.descuadreAcumulado)}</p>
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
                    <span>Recepción y Arqueo</span>
                  </button>

                  <button
                    onClick={() => setTesoreroTab('EGRESOS')}
                    className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                      tesoreroTab === 'EGRESOS' ? 'bg-indigo-950 text-white shadow-xs' : 'bg-white text-slate-600 border hover:bg-slate-50'
                    }`}
                  >
                    <TrendingDown className="w-4 h-4 text-rose-400" />
                    <span>Registrar Gasto / Salida</span>
                  </button>

                  <button
                    onClick={() => setTesoreroTab('LIBRO')}
                    className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                      tesoreroTab === 'LIBRO' ? 'bg-indigo-950 text-white shadow-xs' : 'bg-white text-slate-600 border hover:bg-slate-50'
                    }`}
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                    <span>Libro Único ({movimientos.length})</span>
                  </button>

                  <button
                    onClick={() => setTesoreroTab('CIERRE_MES')}
                    className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                      tesoreroTab === 'CIERRE_MES' ? 'bg-indigo-950 text-white shadow-xs' : 'bg-white text-slate-600 border hover:bg-slate-50'
                    }`}
                  >
                    <Calendar className="w-4 h-4 text-amber-400" />
                    <span>Cierre de Mes</span>
                  </button>
                </div>

                {tesoreroTab === 'BANDEJA' && (
                  <div className="space-y-6">
                    {kpis.cantidadSolicitudesIncobrable > 0 && (
                      <div className="bg-amber-50 rounded-2xl border-2 border-amber-300 p-5 shadow-sm">
                        <h3 className="font-bold text-amber-950 text-sm mb-3">Solicitudes de Deudas Incobrables</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {movimientos
                            .filter((m) => m.modoRegistro === 'UNIDADES' && Array.isArray(m.compradores) && m.compradores.some((c) => c.solicitudIncobrable))
                            .flatMap((item) => {
                              const precio = Number(item.precioUnitario) || 0;
                              return item.compradores
                                .filter((c) => c.solicitudIncobrable)
                                .map((c) => {
                                  const totalC = c.cantidad * precio;
                                  return (
                                    <div key={`${item.id}-${c.id}`} className="bg-white p-4 rounded-xl border border-amber-300 shadow-xs flex flex-col justify-between gap-3">
                                      <div>
                                        <h4 className="font-bold text-slate-900 text-sm">Deudor: {c.nombre} ({c.cantidad} unid. • {formatCOP(totalC)})</h4>
                                        <p className="text-xs text-amber-900 mt-1"><strong>Motivo:</strong> "{c.motivoIncobrable}"</p>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <button onClick={() => handleTesoreroResolverIncobrable(item.id, c.id, true)} className="flex-1 py-2 bg-emerald-600 text-white text-xs font-bold rounded-lg">Aprobar</button>
                                        <button onClick={() => handleTesoreroResolverIncobrable(item.id, c.id, false)} className="py-2 px-3 bg-rose-50 text-rose-700 text-xs font-bold rounded-lg">Rechazar</button>
                                      </div>
                                    </div>
                                  );
                                });
                            })}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                        <h3 className="font-bold text-slate-900 mb-4">Pendientes por Recoger ({movimientos.filter((m) => m.estado === 'PENDIENTE').length})</h3>
                        {movimientos.filter((m) => m.estado === 'PENDIENTE').length === 0 ? (
                          <p className="text-sm text-slate-500 py-10 text-center">No hay recaudos pendientes.</p>
                        ) : (
                          <div className="space-y-3">
                            {movimientos
                              .filter((m) => m.estado === 'PENDIENTE')
                              .map((item) => {
                                const tieneAbonoAcumulado = Number(item.ultimoAbonoReportado) > 0;
                                const montoPendienteMostrar = tieneAbonoAcumulado ? Number(item.ultimoAbonoReportado) : Number(item.montoReportado);
                                return (
                                  <div key={item.id} className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 space-y-3">
                                    <div className="flex justify-between items-start">
                                      <div>
                                        <h4 className="font-bold text-sm text-slate-900">{item.actividad}</h4>
                                        <p className="text-xs text-slate-600">Recaudador: {item.responsable} ({item.metodoPago})</p>
                                      </div>
                                      <span className="font-extrabold text-base text-slate-900">{formatCOP(montoPendienteMostrar)}</span>
                                    </div>
                                    <div className="flex gap-2 justify-end">
                                      <button onClick={() => openArqueoModal(item)} className="px-4 py-2 bg-indigo-950 text-white text-xs font-bold rounded-xl">Recibir y Contar</button>
                                      <button onClick={() => handleCerrarRecaudoSinMasNovedad(item)} className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl">Cerrar</button>
                                    </div>
                                  </div>
                                );
                              })}
                          </div>
                        )}
                      </div>

                      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                        <h3 className="font-bold text-slate-900 mb-4">Descuadres en Revisión ({movimientos.filter((m) => m.estado === 'DESCUADRE').length})</h3>
                        {movimientos.filter((m) => m.estado === 'DESCUADRE').length === 0 ? (
                          <p className="text-sm text-slate-500 py-10 text-center">No hay descuadres.</p>
                        ) : (
                          <div className="space-y-3">
                            {movimientos
                              .filter((m) => m.estado === 'DESCUADRE')
                              .map((item) => (
                                <div key={item.id} className="p-4 rounded-xl border border-rose-200 bg-rose-50/40 space-y-2">
                                  <h4 className="font-bold text-sm text-slate-900">{item.actividad} — {item.responsable}</h4>
                                  <p className="text-xs bg-white p-2.5 rounded border text-rose-900">{item.notaTesorero}</p>
                                  <div className="flex gap-2">
                                    <button onClick={() => openArqueoModal(item)} className="flex-1 py-2 bg-white border text-xs font-bold rounded-xl">Recontar</button>
                                    <button onClick={() => handleAprobarAjusteDescuadre(item)} className="flex-1 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl">Aprobar Ajuste</button>
                                  </div>
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {tesoreroTab === 'EGRESOS' && (
                  <div className="max-w-2xl bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="bg-indigo-950 px-6 py-4 text-white">
                      <h3 className="font-bold text-base">Registrar Salida de Dinero (Egreso con Devolución de Sobrante)</h3>
                    </div>
                    <form onSubmit={handleRegistrarEgreso} className="p-6 space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Fecha</label>
                          <input type="date" required value={egrFecha} onChange={(e) => setEgrFecha(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-sm" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Categoría</label>
                          <select value={egrCategoria} onChange={(e) => setEgrCategoria(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-sm font-medium">
                            {CATEGORIAS_EGRESO.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Concepto / Detalle</label>
                        <input type="text" required placeholder="Ej. Compra de gas..." value={egrConcepto} onChange={(e) => setEgrConcepto(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-sm" />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Responsable</label>
                          <input type="text" required placeholder="Ej. Carlos" value={egrResponsable} onChange={(e) => setEgrResponsable(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-sm" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Valor Entregado ($)</label>
                          <input type="number" min="100" required placeholder="100000" value={egrMonto} onChange={(e) => setEgrMonto(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-sm font-bold text-rose-700" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold uppercase text-emerald-800 mb-1">Sobrante devuelto ($)</label>
                          <input type="number" min="0" placeholder="15000" value={egrSobranteDevuelto} onChange={(e) => setEgrSobranteDevuelto(e.target.value)} className="w-full px-3 py-2 border border-emerald-300 rounded-xl text-sm font-bold text-emerald-800 bg-emerald-50/50" />
                        </div>
                      </div>
                      <button type="submit" className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm rounded-xl shadow-md">Registrar Salida y Devolución</button>
                    </form>
                  </div>
                )}

                {tesoreroTab === 'LIBRO' && (
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-5 border-b border-slate-200 flex justify-between items-center gap-4 bg-slate-50">
                      <h3 className="font-bold text-slate-900">Libro Único de Tesorería</h3>
                      <div className="flex items-center gap-2">
                        <input type="text" placeholder="Buscar..." value={busquedaLibro} onChange={(e) => setBusquedaLibro(e.target.value)} className="px-3 py-2 border rounded-xl text-xs" />
                        <select value={filtroLibro} onChange={(e) => setFiltroLibro(e.target.value)} className="px-3 py-2 border rounded-xl text-xs font-semibold">
                          <option value="TODOS">Todos</option>
                          <option value="VERIFICADO">Verificados</option>
                          <option value="PENDIENTE">Pendientes</option>
                          <option value="EGRESOS">Egresos</option>
                        </select>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-sm">
                        <thead>
                          <tr className="bg-slate-100 text-slate-600 text-[11px] uppercase border-b">
                            <th className="py-3 px-4">Fecha / ID</th>
                            <th className="py-3 px-4">Actividad / Concepto</th>
                            <th className="py-3 px-4">Responsable</th>
                            <th className="py-3 px-4 text-right">Reportado</th>
                            <th className="py-3 px-4 text-right text-emerald-800">Entrada Real</th>
                            <th className="py-3 px-4 text-right text-rose-800">Salida Neta</th>
                            <th className="py-3 px-4">Estado</th>
                            <th className="py-3 px-4 text-center">Acciones (Permiso Pastor)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 text-xs">
                          {movimientosFiltrados.map((m) => {
                            const salidaRealMuestra = m.tipo === 'EGRESO' ? Math.max(0, (Number(m.montoSalida) || 0) - (Number(m.montoSobranteDevuelto) || 0)) : 0;
                            return (
                              <tr key={m.id} className="hover:bg-slate-50">
                                <td className="py-3 px-4">
                                  <span className="block font-semibold">{m.fecha}</span>
                                  <span className="font-mono text-[10px] text-slate-400">{m.id}</span>
                                </td>
                                <td className="py-3 px-4">
                                  <span className="font-bold text-slate-900">{m.actividad}</span>
                                  <span className="text-slate-500 block">{m.descripcion}</span>
                                  {m.notaTesorero && <span className="block text-[10px] text-indigo-900 mt-1">{m.notaTesorero}</span>}
                                </td>
                                <td className="py-3 px-4 font-bold">{m.responsable}</td>
                                <td className="py-3 px-4 text-right">{m.tipo === 'INGRESO' ? formatCOP(m.montoReportado) : '—'}</td>
                                <td className="py-3 px-4 text-right font-extrabold text-emerald-700">{m.montoRecibido > 0 ? formatCOP(m.montoRecibido) : '—'}</td>
                                <td className="py-3 px-4 text-right font-extrabold text-rose-600">{m.tipo === 'EGRESO' ? formatCOP(salidaRealMuestra) : '—'}</td>
                                <td className="py-3 px-4">{renderEstadoBadge(m)}</td>
                                <td className="py-3 px-4 text-center">
                                  <div className="flex items-center justify-center gap-1">
                                    <button onClick={() => setEditingTesoreroMov({ ...m })} className="px-2 py-1 bg-amber-600 text-white rounded font-bold">Modificar</button>
                                    {m.borradoAutorizado ? (
                                      <button onClick={() => setEliminarItemModal(m)} className="px-2 py-1 bg-rose-600 text-white rounded font-bold animate-pulse">Borrar</button>
                                    ) : m.solicitudBorrado ? (
                                      <span className="text-[10px] bg-amber-100 text-amber-900 px-2 py-1 rounded font-bold">Esperando Permiso</span>
                                    ) : (
                                      <button onClick={() => { setSolicitudBorradoModal(m); setMotivoBorradoInput(''); }} className="px-2 py-1 bg-slate-200 text-slate-800 rounded font-bold">Solicitar Borrado</button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {tesoreroTab === 'CIERRE_MES' && (
                  <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                        <Calendar className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-slate-900">Módulo de Cierre de Mes</h3>
                        <p className="text-xs text-slate-500">Sella y archiva las cuentas del mes con balance neto y reporte descargable.</p>
                      </div>
                    </div>

                    <form onSubmit={handleEjecutarCierreDeMes} className="space-y-4 bg-slate-50 p-5 rounded-xl border border-slate-200">
                      <div>
                        <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Seleccionar Mes a Cerrar</label>
                        <input
                          type="month"
                          required
                          value={mesCierreInput}
                          onChange={(e) => setMesCierreInput(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white font-bold"
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-indigo-950 font-extrabold text-sm rounded-xl shadow-md transition-all"
                      >
                        Ejecutar y Sellar Cierre de Mes
                      </button>
                    </form>

                    <div className="space-y-3">
                      <h4 className="text-xs font-bold uppercase text-slate-600">Historial de Cierres Mensuales Ejecutados</h4>
                      {cierresMensuales.length === 0 ? (
                        <p className="text-xs text-slate-500 py-6 text-center">No hay cierres mensuales ejecutados todavía.</p>
                      ) : (
                        <div className="space-y-2">
                          {cierresMensuales.map(c => (
                            <div key={c.id} className="p-4 rounded-xl border border-slate-200 bg-white flex justify-between items-center text-xs shadow-2xs">
                              <div>
                                <span className="font-bold text-sm text-slate-900">Mes: {c.mes}</span>
                                <span className="text-slate-500 block">Cerrado el {c.fechaCierre} por {c.responsableCierre} ({c.cantidadMovimientos} movimientos)</span>
                              </div>
                              <div className="text-right">
                                <span className="font-extrabold text-emerald-700 block text-sm">Balance: {formatCOP(c.balanceNeto)}</span>
                                <span className="text-[10px] text-slate-400">Caja final: {formatCOP(c.sadoCajaFinal)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
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
                <h2 className="text-xl font-bold text-slate-900">Ingreso Pastor / Administrador</h2>
                <p className="text-sm text-slate-500 mt-1">Supervisión total, autorizaciones de borrado, usuarios y cierres de mes.</p>

                <form onSubmit={handleAdminLogin} className="mt-6 space-y-4 text-left">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Usuario Admin</label>
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
                    className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-indigo-950 font-extrabold text-sm shadow-md transition-all mt-2"
                  >
                    Ingresar como Pastor / Administrador
                  </button>
                </form>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
                    <span className="text-sm font-bold text-slate-800">
                      Pastor / Admin Conectado: <span className="text-amber-700 underline">{usuarioLogueadoAdmin.nombre}</span>
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button onClick={handleExportCSV} className="px-3 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold">Descargar Excel</button>
                    <button onClick={() => setShowBorrarTodoModal(true)} className="px-3 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold">Reiniciar BD</button>
                    <button onClick={() => setUsuarioLogueadoAdmin(null)} className="px-3 py-2 bg-rose-50 text-rose-700 rounded-xl text-xs font-semibold">Cerrar Sesión</button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
                  <button
                    onClick={() => setAdminTab('AUDITORIA')}
                    className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                      adminTab === 'AUDITORIA' ? 'bg-indigo-950 text-white shadow-xs' : 'bg-white text-slate-600 border hover:bg-slate-50'
                    }`}
                  >
                    <Eye className="w-4 h-4 text-amber-400" />
                    <span>Auditoría y Permisos de Borrado</span>
                    {kpis.cantidadSolicitudesBorrado > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full bg-rose-600 text-white text-xs font-extrabold animate-pulse">
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
                    <span>Usuarios y Claves</span>
                  </button>

                  <button
                    onClick={() => setAdminTab('CIERRE_MES')}
                    className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                      adminTab === 'CIERRE_MES' ? 'bg-indigo-950 text-white shadow-xs' : 'bg-white text-slate-600 border hover:bg-slate-50'
                    }`}
                  >
                    <Calendar className="w-4 h-4 text-amber-400" />
                    <span>Cierre de Mes Oficial</span>
                  </button>
                </div>

                {adminTab === 'AUDITORIA' && (
                  <div className="space-y-6">
                    {kpis.cantidadSolicitudesBorrado > 0 && (
                      <div className="bg-rose-50 rounded-2xl border-2 border-rose-300 p-5 shadow-sm">
                        <h3 className="font-bold text-rose-950 text-sm mb-3">Solicitudes de Borrado de Tesorería</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {movimientos
                            .filter((m) => m.solicitudBorrado)
                            .map((item) => (
                              <div key={item.id} className="bg-white p-4 rounded-xl border border-rose-200 shadow-xs flex flex-col justify-between gap-3">
                                <div>
                                  <h4 className="font-bold text-slate-900 text-sm">{item.actividad} — {item.descripcion}</h4>
                                  <p className="text-xs text-rose-900 mt-1"><strong>Motivo:</strong> "{item.motivoBorrado}"</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button onClick={() => handleResolverBorradoAdmin(item, true)} className="flex-1 py-2 bg-rose-600 text-white text-xs font-bold rounded-lg">Autorizar Borrado</button>
                                  <button onClick={() => handleResolverBorradoAdmin(item, false)} className="py-2 px-3 bg-slate-100 text-slate-800 text-xs font-bold rounded-lg">Denegar</button>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="bg-white p-4 rounded-2xl border shadow-sm">
                        <span className="text-[11px] font-bold uppercase text-slate-500">Saldo Disponible en Caja</span>
                        <p className="text-xl font-extrabold text-emerald-700 mt-1">{formatCOP(kpis.saldoRealEnCaja)}</p>
                      </div>
                      <div className="bg-white p-4 rounded-2xl border shadow-sm">
                        <span className="text-[11px] font-bold uppercase text-slate-500">Total Entradas</span>
                        <p className="text-xl font-extrabold text-slate-900 mt-1">{formatCOP(kpis.totalEntradasVerificadas)}</p>
                      </div>
                      <div className="bg-white p-4 rounded-2xl border shadow-sm">
                        <span className="text-[11px] font-bold uppercase text-slate-500">Total Salidas / Gastos</span>
                        <p className="text-xl font-extrabold text-rose-600 mt-1">- {formatCOP(kpis.totalSalidas)}</p>
                      </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                      <h3 className="font-bold text-base text-slate-900 mb-4">Auditoría General de Movimientos</h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-slate-100 text-slate-600 uppercase border-b">
                              <th className="py-3 px-3">Fecha / ID</th>
                              <th className="py-3 px-3">Actividad</th>
                              <th className="py-3 px-3">Responsable</th>
                              <th className="py-3 px-3 text-right">Entrada Real</th>
                              <th className="py-3 px-3 text-right text-rose-800">Salida Neta</th>
                              <th className="py-3 px-3">Estado / Permiso</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200">
                            {movimientos.map((m) => {
                              const salidaRealMuestra = m.tipo === 'EGRESO' ? Math.max(0, (Number(m.montoSalida) || 0) - (Number(m.montoSobranteDevuelto) || 0)) : 0;
                              return (
                                <tr key={m.id} className="hover:bg-slate-50">
                                  <td className="py-3 px-3 font-semibold">{m.fecha} <span className="font-mono text-[10px] text-slate-400">({m.id})</span></td>
                                  <td className="py-3 px-3 font-bold text-slate-900">{m.actividad}</td>
                                  <td className="py-3 px-3">{m.responsable}</td>
                                  <td className="py-3 px-3 text-right font-extrabold text-emerald-700">{m.montoRecibido > 0 ? formatCOP(m.montoRecibido) : '—'}</td>
                                  <td className="py-3 px-3 text-right font-extrabold text-rose-600">{m.tipo === 'EGRESO' ? formatCOP(salidaRealMuestra) : '—'}</td>
                                  <td className="py-3 px-3">
                                    {renderEstadoBadge(m)}
                                    {m.borradoAutorizado && <span className="block text-[10px] text-rose-700 font-bold mt-0.5">Borrado Autorizado</span>}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {adminTab === 'USUARIOS' && (
                  <div className="max-w-3xl mx-auto space-y-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
                      <h3 className="font-bold text-lg text-slate-900">Gestión de Usuarios</h3>
                      <div className="space-y-2">
                        {usuariosSistema.map((u) => (
                          <div key={u.id} className="py-3 px-4 flex items-center justify-between text-xs bg-slate-50 rounded-xl border">
                            <div>
                              <span className="font-bold text-slate-900 text-sm">{u.nombre}</span>
                              <span className="text-slate-500 ml-1">({u.usuario} - {u.rol})</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <button onClick={() => setEditingUser({ ...u })} className="px-3 py-1 bg-amber-600 text-white rounded-lg font-bold">Modificar</button>
                              <button onClick={() => setEliminarUsuarioModal(u)} className="px-3 py-1 bg-rose-600 text-white rounded-lg font-bold">Eliminar</button>
                            </div>
                          </div>
                        ))}
                      </div>

                      <form onSubmit={handleCrearUsuarioSistema} className="pt-4 border-t space-y-3">
                        <h4 className="text-xs font-bold uppercase text-indigo-950">Crear Nuevo Usuario</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <input type="text" required placeholder="Nombre completo" value={nuevoUserNombre} onChange={(e) => setNuevoUserNombre(e.target.value)} className="px-3 py-2 border rounded-lg text-xs" />
                          <input type="text" required placeholder="Usuario (login)" value={nuevoUserAlias} onChange={(e) => setNuevoUserAlias(e.target.value)} className="px-3 py-2 border rounded-lg text-xs" />
                          <input type="text" required placeholder="Contraseña" value={nuevoUserClave} onChange={(e) => setNuevoUserClave(e.target.value)} className="px-3 py-2 border rounded-lg text-xs font-bold" />
                        </div>
                        <select value={nuevoUserRol} onChange={(e) => setNuevoUserRol(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-xs font-semibold">
                          <option value="RECAUDADOR">Recaudador</option>
                          <option value="TESORERO">Tesorero Central</option>
                          <option value="ADMINISTRADOR">Pastor / Administrador</option>
                        </select>
                        <button type="submit" className="w-full py-2.5 bg-indigo-950 text-white rounded-lg text-xs font-bold">Registrar Usuario</button>
                      </form>
                    </div>
                  </div>
                )}

                {adminTab === 'CIERRE_MES' && (
                  <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                        <Calendar className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-slate-900">Módulo Oficial de Cierre de Mes (Pastor / Admin)</h3>
                        <p className="text-xs text-slate-500">Ejecuta el cierre definitivo para congelar las cuentas y generar el reporte mensual.</p>
                      </div>
                    </div>

                    <form onSubmit={handleEjecutarCierreDeMes} className="space-y-4 bg-slate-50 p-5 rounded-xl border border-slate-200">
                      <div>
                        <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Seleccionar Mes a Cerrar</label>
                        <input
                          type="month"
                          required
                          value={mesCierreInput}
                          onChange={(e) => setMesCierreInput(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white font-bold"
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-indigo-950 font-extrabold text-sm rounded-xl shadow-md transition-all"
                      >
                        Ejecutar y Sellar Cierre Oficial de Mes
                      </button>
                    </form>

                    <div className="space-y-3">
                      <h4 className="text-xs font-bold uppercase text-slate-600">Historial de Cierres Oficiales</h4>
                      {cierresMensuales.length === 0 ? (
                        <p className="text-xs text-slate-500 py-6 text-center">No hay cierres mensuales registrados.</p>
                      ) : (
                        <div className="space-y-2">
                          {cierresMensuales.map(c => (
                            <div key={c.id} className="p-4 rounded-xl border border-slate-200 bg-white flex justify-between items-center text-xs shadow-2xs">
                              <div>
                                <span className="font-bold text-sm text-slate-900">Mes: {c.mes}</span>
                                <span className="text-slate-500 block">Cerrado por {c.responsableCierre} ({c.cantidadMovimientos} movimientos)</span>
                              </div>
                              <div className="text-right">
                                <span className="font-extrabold text-emerald-700 block text-sm">Balance: {formatCOP(c.balanceNeto)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>

      {/* Modales complementarios (Borrado, Arqueo, Abonos, etc.) */}
      {solicitudBorradoModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="font-bold text-base text-rose-800">Solicitar Autorización de Borrado</h3>
            <form onSubmit={handleEnviarSolicitudBorrado}>
              <textarea rows={3} required placeholder="Motivo..." value={motivoBorradoInput} onChange={(e) => setMotivoBorradoInput(e.target.value)} className="w-full p-3 border text-xs rounded-xl mb-3 bg-rose-50" autoFocus />
              <div className="flex gap-2">
                <button type="button" onClick={() => setSolicitudBorradoModal(null)} className="flex-1 py-2 border rounded-xl text-xs">Cancelar</button>
                <button type="submit" className="flex-1 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold">Enviar al Pastor</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {arqueoItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="font-bold text-base text-slate-900">Arqueo y Recepción de Efectivo</h3>
            <form onSubmit={handleConfirmarArqueo}>
              <input type="number" min="0" required value={montoFisicoContado} onChange={(e) => setMontoFisicoContado(e.target.value)} className="w-full p-3 border-2 text-lg font-extrabold rounded-xl text-center mb-4" autoFocus />
              <div className="flex gap-2">
                <button type="button" onClick={() => setArqueoItem(null)} className="flex-1 py-2.5 border rounded-xl text-xs">Cancelar</button>
                <button type="submit" className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold">Confirmar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {abonoModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="font-bold text-base text-slate-900">Registrar Abono</h3>
            <form onSubmit={handleConfirmarAbono}>
              <input type="number" min="100" max={abonoModal.saldoPendiente} required value={valorAbonoInput} onChange={(e) => setValorAbonoInput(e.target.value)} className="w-full p-3 border-2 text-lg font-extrabold rounded-xl text-center mb-4" autoFocus />
              <div className="flex gap-2">
                <button type="button" onClick={() => setAbonoModal(null)} className="flex-1 py-2.5 border rounded-xl text-xs">Cancelar</button>
                <button type="submit" className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold">Guardar Abono</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
