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
  RotateCcw,
  Search,
  Filter,
  Receipt,
  Calculator,
  UserCheck,
  ArrowUpRight,
  ArrowDownRight,
  X,
  FileSpreadsheet,
  Info,
  CreditCard,
  Banknote,
  Edit3,
  Package,
  Users,
  UserPlus,
  Trash2,
  ChevronDown,
  ChevronUp,
  BadgeDollarSign,
  ShoppingBag,
  KeyRound
} from 'lucide-react';

// Formateador de moneda en Pesos Colombianos (COP)
const formatCOP = (value) => {
  const num = Number(value) || 0;
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(num);
};

// Helper para calcular métricas de inventario/compradores en registros por unidad
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
  let plataPagada = 0;
  let plataFiada = 0;

  compradores.forEach((c) => {
    const cant = Number(c.cantidad) || 0;
    const totalComp = cant * precioUnitario;
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

  const unidadesSinVender = Math.max(0, producidas - (unidadesPagadas + unidadesFiadas));
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
    unidadesSinVender,
    plataSinVender,
    totalUnidadesFaltantes,
    totalPlataFaltante,
  };
};

const INITIAL_DATA = [
  {
    id: 'REC-101',
    fecha: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0],
    tipo: 'INGRESO',
    modoRegistro: 'GENERAL',
    actividad: 'Venta de Comidas',
    descripcion: 'Almuerzos dominicales (Arroz con pollo y limonada)',
    responsable: 'Hna. Marta Gómez',
    metodoPago: 'Efectivo',
    montoReportado: 485000,
    montoRecibido: 485000,
    montoSalida: 0,
    estado: 'VERIFICADO',
    notaTesorero: 'Dinero contado exacto en sobre sellado.',
  },
  {
    id: 'EGR-102',
    fecha: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0],
    tipo: 'EGRESO',
    modoRegistro: 'GENERAL',
    actividad: 'Insumos Cocina',
    descripcion: 'Compra de pollo, arroz, verduras y desechables para actividad',
    responsable: 'Hno. Carlos Ruiz',
    metodoPago: 'Efectivo',
    montoReportado: 0,
    montoRecibido: 0,
    montoSalida: 165000,
    estado: 'EGRESO_REGISTRADO',
    notaTesorero: 'Factura #4512 adjunta en carpeta física.',
  },
  {
    id: 'REC-103',
    fecha: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    tipo: 'INGRESO',
    modoRegistro: 'UNIDADES',
    actividad: 'Tamales / Bollos',
    descripcion: 'Producción de 30 tamales tolimenses pro-templo ($12.000 c/u)',
    responsable: 'Hno. Andrés Castro',
    metodoPago: 'Efectivo',
    cantidadProducida: 30,
    precioUnitario: 12000,
    compradores: [
      { id: 'C-1', nombre: 'Familia Rodríguez', cantidad: 10, estadoPago: 'PAGADO', montoAbonado: 120000 },
      { id: 'C-2', nombre: 'Hna. Lucía Pérez', cantidad: 8, estadoPago: 'PAGADO', montoAbonado: 96000 },
      { id: 'C-3', nombre: 'Don Jorge Morales', cantidad: 7, estadoPago: 'PAGADO', montoAbonado: 84000 },
      { id: 'C-4', nombre: 'Hno. Pedro Salgado', cantidad: 3, estadoPago: 'FIADO', montoAbonado: 12000 },
    ],
    montoReportado: 312000,
    montoRecibido: 300000,
    montoSalida: 0,
    estado: 'DESCUADRE',
    notaTesorero: 'Se reportaron $312.000 (incluyendo abono de $12.000), pero al contar faltaron $12.000. Revisar con Andrés.',
  },
  {
    id: 'REC-104',
    fecha: new Date().toISOString().split('T')[0],
    tipo: 'INGRESO',
    modoRegistro: 'UNIDADES',
    actividad: 'Venta de Comidas',
    descripcion: 'Bandejas de lechona dominical ($15.000 c/u)',
    responsable: 'Laura Méndez',
    metodoPago: 'Efectivo',
    cantidadProducida: 20,
    precioUnitario: 15000,
    compradores: [
      { id: 'C-11', nombre: 'Pastor Samuel', cantidad: 4, estadoPago: 'PAGADO', montoAbonado: 60000 },
      { id: 'C-12', nombre: 'Hna. Camila Ortiz', cantidad: 6, estadoPago: 'PAGADO', montoAbonado: 90000 },
      { id: 'C-13', nombre: 'Jóvenes Alabanza', cantidad: 5, estadoPago: 'PAGADO', montoAbonado: 75000 },
      { id: 'C-14', nombre: 'Hno. Esteban Gil', cantidad: 2, estadoPago: 'FIADO', montoAbonado: 10000 },
    ],
    montoReportado: 235000,
    montoRecibido: 0,
    montoSalida: 0,
    estado: 'PENDIENTE',
    notaTesorero: '',
  },
  {
    id: 'REC-105',
    fecha: new Date().toISOString().split('T')[0],
    tipo: 'INGRESO',
    modoRegistro: 'GENERAL',
    actividad: 'Rifa',
    descripcion: 'Boletas vendidas rifa de ancheta familiar',
    responsable: 'Hna. Marta Gómez',
    metodoPago: 'Transferencia / Nequi',
    montoReportado: 150000,
    montoRecibido: 0,
    montoSalida: 0,
    estado: 'PENDIENTE',
    notaTesorero: '',
  },
];

const ACTIVIDADES_RECAUDO = [
  'Venta de Comidas',
  'Tamales / Bollos',
  'Rifa',
  'Evento Juvenil',
  'Ofrenda Especial',
  'Bazar / Postres',
  'Otro',
];

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
  const [movimientos, setMovimientos] = useState(() => {
    try {
      const saved = localStorage.getItem('iglesia_tesoreria_v2');
      return saved ? JSON.parse(saved) : INITIAL_DATA;
    } catch {
      return INITIAL_DATA;
    }
  });

  const [pinRecaudador, setPinRecaudador] = useState(() => {
    return localStorage.getItem('pin_recaudador_iglesia') || '2026';
  });
  const [pinTesorero, setPinTesorero] = useState(() => {
    return localStorage.getItem('pin_tesorero_iglesia') || '1234';
  });

  const [showCambiarPinRecaudador, setShowCambiarPinRecaudador] = useState(false);
  const [nuevoPinRecInput, setNuevoPinRecInput] = useState('');

  const [showCambiarPinTesorero, setShowCambiarPinTesorero] = useState(false);
  const [nuevoPinTesInput, setNuevoPinTesInput] = useState('');

  const [showBorrarTodoModal, setShowBorrarTodoModal] = useState(false);

  const [activeRole, setActiveRole] = useState('RECAUDADOR');
  const [isRecaudadorAuth, setIsRecaudadorAuth] = useState(false);
  const [recPinInput, setRecPinInput] = useState('');
  const [recPinError, setRecPinError] = useState('');

  const [isTesoreroAuth, setIsTesoreroAuth] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  const [toast, setToast] = useState(null);

  const [modoRecaudo, setModoRecaudo] = useState('UNIDADES');
  const [recFecha, setRecFecha] = useState(() => new Date().toISOString().split('T')[0]);
  const [recNombre, setRecNombre] = useState('');
  const [recActividad, setRecActividad] = useState('Tamales / Bollos');
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

  const [expandedRows, setExpandedRows] = useState({ 'REC-103': true, 'REC-104': true });

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

  const [filtroLibro, setFiltroLibro] = useState('TODOS');
  const [busquedaLibro, setBusquedaLibro] = useState('');

  useEffect(() => {
    try {
      localStorage.setItem('iglesia_tesoreria_v2', JSON.stringify(movimientos));
    } catch {}
  }, [movimientos]);

  useEffect(() => {
    try {
      localStorage.setItem('pin_recaudador_iglesia', pinRecaudador);
      localStorage.setItem('pin_tesorero_iglesia', pinTesorero);
    } catch {}
  }, [pinRecaudador, pinTesorero]);

  const toggleExpandRow = (id) => {
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4500);
  };

  const handleGuardarNuevoPinRec = (e) => {
    e.preventDefault();
    if (!nuevoPinRecInput.trim()) {
      showToast('Ingresa una contraseña válida.', 'error');
      return;
    }
    setPinRecaudador(nuevoPinRecInput.trim());
    setShowCambiarPinRecaudador(false);
    setNuevoPinRecInput('');
    showToast('Contraseña de Recaudador actualizada con éxito.', 'success');
  };

  const handleGuardarNuevoPinTes = (e) => {
    e.preventDefault();
    if (!nuevoPinTesInput.trim()) {
      showToast('Ingresa una contraseña válida.', 'error');
      return;
    }
    setPinTesorero(nuevoPinTesInput.trim());
    setShowCambiarPinTesorero(false);
    setNuevoPinTesInput('');
    showToast('Contraseña de Tesorería actualizada con éxito.', 'success');
  };

  const handleBorrarTodoContenido = () => {
    setMovimientos([]);
    localStorage.removeItem('iglesia_tesoreria_v2');
    setShowBorrarTodoModal(false);
    showToast('Se han borrado todos los registros de la tesorería.', 'warning');
  };

  const handleRegistrarRecaudo = (e) => {
    e.preventDefault();

    if (!recNombre.trim()) {
      showToast('Por favor ingresa el nombre del recaudador responsable.', 'error');
      return;
    }

    if (modoRecaudo === 'UNIDADES') {
      const producidas = Number(recCantidadProducida) || 0;
      const precio = Number(recPrecioUnitario) || 0;

      if (producidas <= 0 || precio <= 0) {
        showToast('Ingresa una cantidad producida y un precio unitario válidos.', 'error');
        return;
      }

      const valorRecaudadoEnMano = resumenFormUnidades.plataRecaudada;
      const descFinal =
        recDescripcion.trim() ||
        `Producción de ${producidas} unidades a ${formatCOP(precio)} c/u (${resumenFormUnidades.unidadesPagadas} pagadas, ${resumenFormUnidades.unidadesFiadas} fiadas, ${resumenFormUnidades.unidadesSinVender} sin vender)`;

      if (editingRecaudoId) {
        setMovimientos((prev) =>
          prev.map((m) =>
            m.id === editingRecaudoId
              ? {
                  ...m,
                  fecha: recFecha,
                  modoRegistro: 'UNIDADES',
                  actividad: recActividad,
                  descripcion: descFinal,
                  responsable: recNombre.trim(),
                  metodoPago: recMetodo,
                  cantidadProducida: producidas,
                  precioUnitario: precio,
                  compradores: Array.isArray(recCompradores) ? [...recCompradores] : [],
                  montoReportado: valorRecaudadoEnMano,
                  edicionAutorizada: false,
                  solicitudEdicion: false,
                  motivoEdicion: '',
                }
              : m
          )
        );
        setEditingRecaudoId(null);
        setRecDescripcion('');
        setRecCompradores([]);
        showToast('Recaudo modificado y actualizado. El permiso de edición se ha cerrado.', 'success');
        return;
      }

      const nuevoId = `REC-${Math.floor(100 + Math.random() * 900)}`;
      const nuevoRegistro = {
        id: nuevoId,
        fecha: recFecha,
        tipo: 'INGRESO',
        modoRegistro: 'UNIDADES',
        actividad: recActividad,
        descripcion: descFinal,
        responsable: recNombre.trim(),
        metodoPago: recMetodo,
        cantidadProducida: producidas,
        precioUnitario: precio,
        compradores: Array.isArray(recCompradores) ? [...recCompradores] : [],
        montoReportado: valorRecaudadoEnMano,
        montoRecibido: 0,
        montoSalida: 0,
        estado: 'PENDIENTE',
        notaTesorero: '',
      };

      setMovimientos([nuevoRegistro, ...movimientos]);
      setExpandedRows((prev) => ({ ...prev, [nuevoId]: true }));
      setRecDescripcion('');
      setRecCompradores([]);
      showToast(
        `Actividad registrada: ${formatCOP(valorRecaudadoEnMano)} recaudados en mano y ${formatCOP(
          resumenFormUnidades.totalPlataFaltante
        )} pendientes en calle.`,
        'success'
      );
      return;
    }

    const valor = Number(recMonto.toString().replace(/\D/g, ''));
    if (!recDescripcion.trim() || valor <= 0) {
      showToast('Por favor completa la descripción y un monto válido.', 'error');
      return;
    }

    if (editingRecaudoId) {
      setMovimientos((prev) =>
        prev.map((m) =>
          m.id === editingRecaudoId
            ? {
                ...m,
                fecha: recFecha,
                modoRegistro: 'GENERAL',
                actividad: recActividad,
                descripcion: recDescripcion.trim(),
                responsable: recNombre.trim(),
                metodoPago: recMetodo,
                cantidadProducida: undefined,
                precioUnitario: undefined,
                compradores: undefined,
                montoReportado: valor,
                edicionAutorizada: false,
                solicitudEdicion: false,
                motivoEdicion: '',
              }
            : m
        )
      );
      setEditingRecaudoId(null);
      setRecDescripcion('');
      setRecMonto('');
      showToast('Recaudo general modificado. El permiso de edición se ha cerrado.', 'success');
      return;
    }

    const nuevoRegistro = {
      id: `REC-${Math.floor(100 + Math.random() * 900)}`,
      fecha: recFecha,
      tipo: 'INGRESO',
      modoRegistro: 'GENERAL',
      actividad: recActividad,
      descripcion: recDescripcion.trim(),
      responsable: recNombre.trim(),
      metodoPago: recMetodo,
      montoReportado: valor,
      montoRecibido: 0,
      montoSalida: 0,
      estado: 'PENDIENTE',
      notaTesorero: '',
    };

    setMovimientos([nuevoRegistro, ...movimientos]);
    setRecDescripcion('');
    setRecMonto('');
    showToast('Recaudo registrado y enviado a Tesorería (Pendiente por recoger).', 'success');
  };

  const handleIniciarEdicionRecaudo = (item) => {
    if (item.estado === 'VERIFICADO') {
      showToast('Este recaudo ya fue recibido y verificado por Tesorería; no se puede editar.', 'warning');
      return;
    }
    if (!item.edicionAutorizada) {
      showToast('Necesitas autorización de Tesorería para modificar este registro.', 'warning');
      return;
    }
    setEditingRecaudoId(item.id);
    setRecFecha(item.fecha || new Date().toISOString().split('T')[0]);
    setRecActividad(item.actividad || 'Tamales / Bollos');
    setRecNombre(item.responsable || '');
    setRecDescripcion(item.descripcion || '');
    setRecMetodo(item.metodoPago || 'Efectivo');

    if (item.modoRegistro === 'UNIDADES') {
      setModoRecaudo('UNIDADES');
      setRecCantidadProducida(String(item.cantidadProducida ?? '30'));
      setRecPrecioUnitario(String(item.precioUnitario ?? '12000'));
      setRecCompradores(Array.isArray(item.compradores) ? [...item.compradores] : []);
      setRecMonto('');
    } else {
      setModoRecaudo('GENERAL');
      setRecMonto(String(item.montoReportado || ''));
      setRecCompradores([]);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
    showToast(`Editando registro ${item.id}. Realiza los cambios y presiona "Guardar Cambios".`, 'success');
  };

  const handleCancelarEdicionRecaudo = () => {
    setEditingRecaudoId(null);
    setRecDescripcion('');
    setRecMonto('');
    setRecCompradores([]);
  };

  const handleEnviarSolicitudEdicion = (e) => {
    e.preventDefault();
    if (!solicitudEdicionModal) return;

    const motivo = motivoSolicitudEdicion.trim();
    if (!motivo) {
      showToast('Escribe brevemente qué dato necesitas corregir para que Tesorería lo autorice.', 'error');
      return;
    }

    setMovimientos((prev) =>
      prev.map((m) =>
        m.id === solicitudEdicionModal.id
          ? {
              ...m,
              solicitudEdicion: true,
              motivoEdicion: motivo,
            }
          : m
      )
    );

    showToast(`Solicitud enviada a Tesorería para el registro ${solicitudEdicionModal.id}.`, 'success');
    setSolicitudEdicionModal(null);
    setMotivoSolicitudEdicion('');
  };

  const handleAutorizarEdicionTesorero = (item, aprobar) => {
    setMovimientos((prev) =>
      prev.map((m) =>
        m.id === item.id
          ? {
              ...m,
              edicionAutorizada: aprobar,
              solicitudEdicion: false,
              notaTesorero: aprobar
                ? `${m.notaTesorero ? m.notaTesorero + ' | ' : ''}[Edición autorizada por Tesorería: ${m.motivoEdicion || 'Corrección solicitada'}]`
                : `${m.notaTesorero ? m.notaTesorero + ' | ' : ''}[Solicitud de edición rechazada por Tesorería]`,
            }
          : m
      )
    );
    showToast(
      aprobar
        ? `Edición autorizada para ${item.id}. La recaudadora ya puede corregirlo.`
        : `Solicitud de edición rechazada para ${item.id}.`,
      aprobar ? 'success' : 'warning'
    );
  };

  const resumenFormUnidades = useMemo(() => {
    const producidas = Number(recCantidadProducida) || 0;
    const precio = Number(recPrecioUnitario) || 0;
    const totalEsperado = producidas * precio;

    let unidadesPagadas = 0;
    let unidadesFiadas = 0;
    let plataRecaudada = 0;
    let plataFiada = 0;

    const listaCompradores = Array.isArray(recCompradores) ? recCompradores : [];

    listaCompradores.forEach((c) => {
      const q = Number(c?.cantidad) || 0;
      const totalComp = q * precio;
      const abonado =
        c?.estadoPago === 'PAGADO'
          ? totalComp
          : Math.min(totalComp, Math.max(0, Number(c?.montoAbonado) || 0));
      const saldo = Math.max(0, totalComp - abonado);

      plataRecaudada += abonado;
      plataFiada += saldo;

      if (saldo === 0) unidadesPagadas += q;
      else unidadesFiadas += q;
    });

    const unidadesAsignadas = unidadesPagadas + unidadesFiadas;
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
      unidadesAsignadas,
      unidadesSinVender,
      plataRecaudada,
      plataFiada,
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
      showToast('Escribe el nombre de la persona que compró o pidió fiado.', 'error');
      return;
    }
    if (cant <= 0) {
      showToast('La cantidad de unidades debe ser mayor a 0.', 'error');
      return;
    }
    if (producidas > 0 && resumenFormUnidades.unidadesAsignadas + cant > producidas) {
      showToast(
        `No puedes asignar ${cant} unidades. Solo quedan ${resumenFormUnidades.unidadesSinVender} disponibles de las ${producidas} producidas.`,
        'error'
      );
      return;
    }

    let montoAbonadoInicial = totalComp;
    let estadoFinal = nuevoCompEstado;

    if (nuevoCompEstado === 'FIADO') {
      const abonoNum = Math.max(0, Number(nuevoCompAbono) || 0);
      if (abonoNum >= totalComp && totalComp > 0) {
        montoAbonadoInicial = totalComp;
        estadoFinal = 'PAGADO';
      } else {
        montoAbonadoInicial = abonoNum;
      }
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
        const nuevoEstado = c.estadoPago === 'PAGADO' ? 'FIADO' : 'PAGADO';
        return {
          ...c,
          estadoPago: nuevoEstado,
          montoAbonado: nuevoEstado === 'PAGADO' ? totalComp : 0,
        };
      })
    );
  };

  const handleEliminarCompradorForm = (compId) => {
    setRecCompradores((prev) => prev.filter((c) => c.id !== compId));
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
      actividad: movimiento.actividad,
      comprador,
      precioUnitario: precio,
      totalComp,
      abonadoActual,
      saldoPendiente,
    });
    setValorAbonoInput(String(saldoPendiente));
  };

  const handleConfirmarAbono = (e) => {
    e.preventDefault();
    if (!abonoModal) return;

    const abonoNuevo = Number(valorAbonoInput.toString().replace(/\D/g, '')) || 0;
    if (abonoNuevo <= 0) {
      showToast('Ingresa un valor de abono mayor a $0.', 'error');
      return;
    }
    if (abonoNuevo > abonoModal.saldoPendiente) {
      showToast(
        `El abono no puede superar el saldo pendiente de ${formatCOP(abonoModal.saldoPendiente)}.`,
        'error'
      );
      return;
    }

    const actualizados = movimientos.map((m) => {
      if (m.id !== abonoModal.movimientoId || m.modoRegistro !== 'UNIDADES') return m;

      const precio = Number(m.precioUnitario) || 0;
      const compradoresActualizados = (m.compradores || []).map((c) => {
        if (c.id !== abonoModal.comprador.id) return c;
        const totalComp = (Number(c.cantidad) || 0) * precio;
        const abonadoPrevio =
          c.estadoPago === 'PAGADO'
            ? totalComp
            : Math.min(totalComp, Math.max(0, Number(c.montoAbonado) || 0));
        const nuevoTotalAbonado = Math.min(totalComp, abonadoPrevio + abonoNuevo);
        const saldado = nuevoTotalAbonado >= totalComp;

        return {
          ...c,
          montoAbonado: nuevoTotalAbonado,
          estadoPago: saldado ? 'PAGADO' : 'FIADO',
        };
      });

      const nuevoMontoReportado = compradoresActualizados.reduce((acc, c) => {
        const totalC = (Number(c.cantidad) || 0) * precio;
        const abonoC =
          c.estadoPago === 'PAGADO'
            ? totalC
            : Math.min(totalC, Math.max(0, Number(c.montoAbonado) || 0));
        return acc + abonoC;
      }, 0);

      return {
        ...m,
        compradores: compradoresActualizados,
        montoReportado: nuevoMontoReportado,
      };
    });

    setMovimientos(actualizados);
    const esPagoTotal = abonoNuevo === abonoModal.saldoPendiente;
    showToast(
      esPagoTotal
        ? `¡Deuda saldada! ${abonoModal.comprador.nombre} completó el pago de ${formatCOP(abonoModal.totalComp)}.`
        : `Abono de ${formatCOP(abonoNuevo)} registrado para ${abonoModal.comprador.nombre}.`,
      'success'
    );
    setAbonoModal(null);
    setValorAbonoInput('');
  };

  const handleTogglePagoCompradorExistente = (movimientoId, compradorId) => {
    const actualizados = movimientos.map((m) => {
      if (m.id !== movimientoId || m.modoRegistro !== 'UNIDADES') return m;

      const precio = Number(m.precioUnitario) || 0;
      const compradoresActualizados = (m.compradores || []).map((c) => {
        if (c.id !== compradorId) return c;
        const totalComp = (Number(c.cantidad) || 0) * precio;
        const nuevoEstado = c.estadoPago === 'PAGADO' ? 'FIADO' : 'PAGADO';
        return {
          ...c,
          estadoPago: nuevoEstado,
          montoAbonado: nuevoEstado === 'PAGADO' ? totalComp : 0,
        };
      });

      const nuevoMontoReportado = compradoresActualizados.reduce((acc, c) => {
        const totalC = (Number(c.cantidad) || 0) * precio;
        const abonoC =
          c.estadoPago === 'PAGADO'
            ? totalC
            : Math.min(totalC, Math.max(0, Number(c.montoAbonado) || 0));
        return acc + abonoC;
      }, 0);

      return {
        ...m,
        compradores: compradoresActualizados,
        montoReportado: nuevoMontoReportado,
      };
    });

    setMovimientos(actualizados);
    showToast('Estado de pago actualizado. El dinero recaudado y la cartera se han recalculado.', 'success');
  };

  const kpis = useMemo(() => {
    let totalEntradasVerificadas = 0;
    let totalSalidas = 0;
    let pendientePorRecoger = 0;
    let descuadreAcumulado = 0;
    let cantidadPendientes = 0;
    let cantidadDescuadres = 0;
    let cantidadSolicitudesEdicion = 0;

    let totalPlataFiadaCalle = 0;
    let totalPlataSinVenderCalle = 0;
    let totalUnidadesFaltantesCalle = 0;
    let cantidadDeudoresActivos = 0;

    movimientos.forEach((m) => {
      if (m.tipo === 'INGRESO') {
        if (m.estado === 'VERIFICADO') {
          totalEntradasVerificadas += Number(m.montoRecibido) || 0;
        } else if (m.estado === 'PENDIENTE') {
          pendientePorRecoger += Number(m.montoReportado) || 0;
          cantidadPendientes += 1;
        } else if (m.estado === 'DESCUADRE') {
          totalEntradasVerificadas += Number(m.montoRecibido) || 0;
          const diff = (Number(m.montoReportado) || 0) - (Number(m.montoRecibido) || 0);
          descuadreAcumulado += diff;
          cantidadDescuadres += 1;
        }
        if (m.solicitudEdicion) {
          cantidadSolicitudesEdicion += 1;
        }

        if (m.modoRegistro === 'UNIDADES') {
          const inv = calcularResumenInventario(m);
          totalPlataFiadaCalle += inv.plataFiada;
          totalPlataSinVenderCalle += inv.plataSinVender;
          totalUnidadesFaltantesCalle += inv.totalUnidadesFaltantes;
          const deudores = (m.compradores || []).filter((c) => c.estadoPago === 'FIADO');
          cantidadDeudoresActivos += deudores.length;
        }
      } else if (m.tipo === 'EGRESO') {
        totalSalidas += Number(m.montoSalida) || 0;
      }
    });

    const saldoRealEnCaja = totalEntradasVerificadas - totalSalidas;
    const totalCarteraYSinVender = totalPlataFiadaCalle + totalPlataSinVenderCalle;

    return {
      totalEntradasVerificadas,
      totalSalidas,
      saldoRealEnCaja,
      pendientePorRecoger,
      descuadreAcumulado,
      cantidadPendientes,
      cantidadDescuadres,
      cantidadSolicitudesEdicion,
      totalPlataFiadaCalle,
      totalPlataSinVenderCalle,
      totalUnidadesFaltantesCalle,
      cantidadDeudoresActivos,
      totalCarteraYSinVender,
    };
  }, [movimientos]);

  const handleRecaudadorLogin = (e) => {
    e.preventDefault();
    if (recPinInput.trim() === pinRecaudador) {
      setIsRecaudadorAuth(true);
      setRecPinError('');
      setRecPinInput('');
      showToast('Acceso concedido al módulo de Recaudadores', 'success');
    } else {
      setRecPinError('Clave incorrecta.');
    }
  };

  const handleTesoreroLogin = (e) => {
    e.preventDefault();
    if (pinInput.trim() === pinTesorero) {
      setIsTesoreroAuth(true);
      setPinError('');
      setPinInput('');
      showToast('Acceso concedido al Libro Único de Tesorería', 'success');
    } else {
      setPinError('Clave incorrecta.');
    }
  };

  const openArqueoModal = (item) => {
    setArqueoItem(item);
    setMontoFisicoContado(
      item.estado === 'DESCUADRE' ? String(item.montoRecibido) : String(item.montoReportado)
    );
    setNotaArqueo(item.notaTesorero || '');
  };

  const handleConfirmarArqueo = (e) => {
    e.preventDefault();
    if (!arqueoItem) return;

    const contado = Number(montoFisicoContado.toString().replace(/\D/g, ''));
    const reportado = Number(arqueoItem.montoReportado);
    const esExacto = contado === reportado;

    const actualizados = movimientos.map((m) => {
      if (m.id === arqueoItem.id) {
        return {
          ...m,
          montoRecibido: contado,
          estado: esExacto ? 'VERIFICADO' : 'DESCUADRE',
          notaTesorero:
            notaArqueo.trim() ||
            (esExacto
              ? 'Recibido y cuadrado conforme.'
              : `Diferencia detectada de ${formatCOP(reportado - contado)} al contar el dinero.`),
        };
      }
      return m;
    });

    setMovimientos(actualizados);
    setArqueoItem(null);

    if (esExacto) {
      showToast('Dinero recibido y verificado. Sumado al Saldo en Caja.', 'success');
    } else {
      showToast('Arqueo guardado con DESCUADRE EN REVISIÓN.', 'warning');
    }
  };

  const handleResolverDescuadre = (item) => {
    const actualizados = movimientos.map((m) => {
      if (m.id === item.id) {
        return {
          ...m,
          montoReportado: m.montoRecibido,
          estado: 'VERIFICADO',
          notaTesorero: `${m.notaTesorero} | [Descuadre auditado y cerrado por Tesorería]`,
        };
      }
      return m;
    });
    setMovimientos(actualizados);
    showToast('Descuadre aclarado y marcado como Verificado.', 'success');
  };

  const handleRegistrarEgreso = (e) => {
    e.preventDefault();
    const valor = Number(egrMonto.toString().replace(/\D/g, ''));
    if (!egrConcepto.trim() || !egrResponsable.trim() || valor <= 0) {
      showToast('Completa todos los campos del gasto y un monto válido.', 'error');
      return;
    }

    const nuevoEgreso = {
      id: `EGR-${Math.floor(100 + Math.random() * 900)}`,
      fecha: egrFecha,
      tipo: 'EGRESO',
      actividad: egrCategoria,
      descripcion: egrConcepto.trim(),
      responsable: egrResponsable.trim(),
      metodoPago: 'Efectivo Caja',
      montoReportado: 0,
      montoRecibido: 0,
      montoSalida: valor,
      estado: 'EGRESO_REGISTRADO',
      notaTesorero: egrNota.trim(),
    };

    setMovimientos([nuevoEgreso, ...movimientos]);
    setEgrConcepto('');
    setEgrMonto('');
    setEgrNota('');
    showToast(`Salida por ${formatCOP(valor)} descontada del Saldo en Caja.`, 'success');
    setTesoreroTab('LIBRO');
  };

  const handleExportCSV = () => {
    const headers = [
      'ID',
      'Fecha',
      'Tipo Movimiento',
      'Modo Registro',
      'Actividad / Categoría',
      'Descripción / Detalle',
      'Responsable',
      'Método',
      'Unid. Producidas',
      'Precio Unitario',
      'Unid. Pagadas',
      'Unid. Fiadas',
      'Unid. Sin Vender',
      'Faltante por Recoger en Calle (COP)',
      'Detalle Compradores / Deudores',
      'Monto Reportado en Mano (COP)',
      'Ingreso Real Recibido en Caja (COP)',
      'Salida / Egreso (COP)',
      'Estado Contable',
      'Observaciones Tesorería',
    ];

    const rows = movimientos.map((m) => {
      const inv = calcularResumenInventario(m);
      const precio = Number(m.precioUnitario) || 0;
      const detallePersonas =
        m.modoRegistro === 'UNIDADES' && Array.isArray(m.compradores)
          ? m.compradores
              .map((c) => {
                const totalC = (Number(c.cantidad) || 0) * precio;
                const abonoC =
                  c.estadoPago === 'PAGADO'
                    ? totalC
                    : Math.min(totalC, Math.max(0, Number(c.montoAbonado) || 0));
                const saldoC = Math.max(0, totalC - abonoC);
                return saldoC > 0
                  ? `${c.nombre} (${c.cantidad} unid - Abonó ${formatCOP(abonoC)} / Debe ${formatCOP(saldoC)})`
                  : `${c.nombre} (${c.cantidad} unid - PAGADO)`;
              })
              .join(' | ')
          : '';

      return [
        m.id,
        m.fecha,
        m.tipo,
        m.modoRegistro || 'GENERAL',
        `"${m.actividad.replace(/"/g, '""')}"`,
        `"${m.descripcion.replace(/"/g, '""')}"`,
        `"${m.responsable.replace(/"/g, '""')}"`,
        m.metodoPago,
        inv.esUnidades ? inv.producidas : '',
        inv.esUnidades ? inv.precioUnitario : '',
        inv.esUnidades ? inv.unidadesPagadas : '',
        inv.esUnidades ? inv.unidadesFiadas : '',
        inv.esUnidades ? inv.unidadesSinVender : '',
        inv.esUnidades ? inv.totalPlataFaltante : 0,
        `"${detallePersonas.replace(/"/g, '""')}"`,
        m.montoReportado,
        m.montoRecibido,
        m.montoSalida,
        m.estado,
        `"${(m.notaTesorero || '').replace(/"/g, '""')}"`,
      ];
    });

    rows.push([]);
    rows.push(['', '', 'RESUMEN DE TESORERÍA', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '']);
    rows.push(['', '', 'Total Entradas Verificadas en Caja', '', '', '', '', '', '', '', '', '', '', '', '', '', kpis.totalEntradasVerificadas, '', '', '']);
    rows.push(['', '', 'Total Salidas / Egresos', '', '', '', '', '', '', '', '', '', '', '', '', '', '', kpis.totalSalidas, '', '']);
    rows.push(['', '', 'Saldo Real en Caja', '', '', '', '', '', '', '', '', '', '', '', '', '', kpis.saldoRealEnCaja, '', '', '']);
    rows.push(['', '', 'Pendiente por Recoger (En mano recaudadores)', '', '', '', '', '', '', '', '', '', '', '', '', kpis.pendientePorRecoger, '', '', '', '']);
    rows.push(['', '', 'Cartera Fiados + Unidades Sin Vender en Calle', '', '', '', '', '', '', '', '', '', '', kpis.totalCarteraYSinVender, '', '', '', '', '', '']);
    rows.push(['', '', 'Descuadre en Revisión', '', '', '', '', '', '', '', '', '', '', '', '', kpis.descuadreAcumulado, '', '', '', '']);

    const csvContent =
      '\uFEFF' + [headers.join(';'), ...rows.map((e) => e.join(';'))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Libro_Unico_Tesoreria_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Libro Único exportado a CSV (listo para abrir en Excel).', 'success');
  };

  const handleResetDemo = () => {
    setMovimientos(INITIAL_DATA);
    localStorage.setItem('iglesia_tesoreria_v2', JSON.stringify(INITIAL_DATA));
    showToast('Datos de demostración restaurados.', 'success');
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
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Recibido / Verificado
          </span>
        );
      case 'PENDIENTE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            Pendiente por recoger
          </span>
        );
      case 'DESCUADRE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            Descuadre en revisión
          </span>
        );
      case 'EGRESO_REGISTRADO':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <ArrowDownRight className="w-3.5 h-3.5 text-rose-500" />
            Salida de Caja
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-12">
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

      <header className="bg-indigo-950 text-white shadow-lg sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-800/80 p-2.5 rounded-xl border border-indigo-700">
                <Wallet className="w-7 h-7 text-emerald-400" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white">
                  Tesorería & Recaudos Eclesiásticos
                </h1>
                <p className="text-xs text-indigo-200">
                  Control transparente de actividades, arqueo y Libro Único de Caja
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-indigo-900/90 p-1.5 rounded-xl border border-indigo-800 self-start md:self-auto">
              <button
                onClick={() => setActiveRole('RECAUDADOR')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  activeRole === 'RECAUDADOR'
                    ? 'bg-white text-indigo-950 shadow-sm'
                    : 'text-indigo-200 hover:text-white hover:bg-indigo-800/50'
                }`}
              >
                {isRecaudadorAuth ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                <span>Soy Recaudador</span>
              </button>

              <button
                onClick={() => setActiveRole('TESORERO')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  activeRole === 'TESORERO'
                    ? 'bg-emerald-500 text-indigo-950 shadow-sm'
                    : 'text-indigo-200 hover:text-white hover:bg-indigo-800/50'
                }`}
              >
                {isTesoreroAuth ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                <span>Tesorería (Libro Único)</span>
                {kpis.cantidadPendientes > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 text-xs font-bold rounded-full bg-amber-400 text-indigo-950">
                    {kpis.cantidadPendientes}
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
            {!isRecaudadorAuth ? (
              <div className="max-w-md mx-auto mt-10 bg-white rounded-2xl shadow-lg border border-slate-200 p-8 text-center">
                <div className="w-14 h-14 bg-indigo-100 text-indigo-900 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <HandCoins className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Acceso Autorizado Recaudadores</h2>
                <p className="text-sm text-slate-500 mt-1">
                  Ingresa tu clave de recaudador para reportar ventas, inventario y abonos de actividades.
                </p>

                <form onSubmit={handleRecaudadorLogin} className="mt-6 space-y-4">
                  <div>
                    <input
                      type="password"
                      maxLength={12}
                      placeholder="••••"
                      value={recPinInput}
                      onChange={(e) => setRecPinInput(e.target.value)}
                      className="w-full text-center text-2xl tracking-[0.5em] font-bold py-3 px-4 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-600 outline-none"
                      autoFocus
                    />
                    {recPinError && (
                      <p className="text-xs text-rose-600 font-semibold mt-2">{recPinError}</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-indigo-950 hover:bg-indigo-900 text-white font-bold text-sm shadow-md transition-all"
                  >
                    Ingresar como Recaudador
                  </button>
                </form>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-sm font-bold text-slate-800">
                      Sesión Activa: Recaudador Autorizado
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setShowCambiarPinRecaudador(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-900 text-xs font-bold transition-all"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      Cambiar mi contraseña
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsRecaudadorAuth(false)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition-all"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      Bloquear Acceso Recaudador
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  <div className="lg:col-span-5">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                      <div
                        className={`px-6 py-4 text-white transition-colors ${
                          editingRecaudoId ? 'bg-amber-700' : 'bg-indigo-900'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            {editingRecaudoId ? (
                              <Edit3 className="w-5 h-5 text-amber-200" />
                            ) : (
                              <PlusCircle className="w-5 h-5 text-emerald-400" />
                            )}
                            <h2 className="font-bold text-base">
                              {editingRecaudoId
                                ? `Modificando Recaudo (${editingRecaudoId})`
                                : 'Registrar Recaudo de Actividad'}
                            </h2>
                          </div>
                          {editingRecaudoId && (
                            <button
                              type="button"
                              onClick={handleCancelarEdicionRecaudo}
                              className="px-2.5 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs font-bold"
                            >
                              Cancelar
                            </button>
                          )}
                        </div>
                        <p className="text-xs text-indigo-100 mt-1">
                          {editingRecaudoId
                            ? 'Corrige cualquier dato equivocado y guarda los cambios.'
                            : 'Registra ventas por unidades (con deudores/abonos) o recaudos generales.'}
                        </p>
                      </div>

                      <form onSubmit={handleRegistrarRecaudo} className="p-6 space-y-4">
                        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200">
                          <button
                            type="button"
                            onClick={() => setModoRecaudo('UNIDADES')}
                            className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                              modoRecaudo === 'UNIDADES'
                                ? 'bg-indigo-900 text-white shadow-xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            <Package className="w-3.5 h-3.5" />
                            Por Unidades / Inventario
                          </button>
                          <button
                            type="button"
                            onClick={() => setModoRecaudo('GENERAL')}
                            className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                              modoRecaudo === 'GENERAL'
                                ? 'bg-indigo-900 text-white shadow-xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            <Banknote className="w-3.5 h-3.5" />
                            Monto General
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                              Fecha
                            </label>
                            <input
                              type="date"
                              required
                              value={recFecha}
                              onChange={(e) => setRecFecha(e.target.value)}
                              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                              Actividad
                            </label>
                            <select
                              value={recActividad}
                              onChange={(e) => setRecActividad(e.target.value)}
                              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none"
                            >
                              {ACTIVIDADES_RECAUDO.map((act) => (
                                <option key={act} value={act}>
                                  {act}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                            Nombre del Recaudador Responsable
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="Ej. Hna. Marta Gómez"
                            value={recNombre}
                            onChange={(e) => setRecNombre(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none"
                          />
                        </div>

                        {modoRecaudo === 'UNIDADES' ? (
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-3 bg-indigo-50/70 p-3.5 rounded-xl border border-indigo-100">
                              <div>
                                <label className="block text-[11px] font-bold uppercase text-indigo-950 mb-1">
                                  Cantidad Producida
                                </label>
                                <input
                                  type="number"
                                  min="1"
                                  required
                                  placeholder="30"
                                  value={recCantidadProducida}
                                  onChange={(e) => setRecCantidadProducida(e.target.value)}
                                  className="w-full px-3 py-2 rounded-lg border border-indigo-200 bg-white text-sm font-extrabold text-slate-900 focus:ring-2 focus:ring-indigo-600 outline-none"
                                />
                              </div>
                              <div>
                                <label className="block text-[11px] font-bold uppercase text-indigo-950 mb-1">
                                  Precio Unitario ($)
                                </label>
                                <input
                                  type="number"
                                  min="100"
                                  step="100"
                                  required
                                  placeholder="12000"
                                  value={recPrecioUnitario}
                                  onChange={(e) => setRecPrecioUnitario(e.target.value)}
                                  className="w-full px-3 py-2 rounded-lg border border-indigo-200 bg-white text-sm font-extrabold text-slate-900 focus:ring-2 focus:ring-indigo-600 outline-none"
                                />
                              </div>
                              <div className="col-span-2 flex items-center justify-between pt-2 border-t border-indigo-200/70 text-xs">
                                <span className="font-semibold text-indigo-900">
                                  Total Esperado ({resumenFormUnidades.producidas} unid.):
                                </span>
                                <span className="font-extrabold text-indigo-950 text-sm">
                                  {formatCOP(resumenFormUnidades.totalEsperado)}
                                </span>
                              </div>
                            </div>

                            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold uppercase text-slate-700 flex items-center gap-1.5">
                                  <Users className="w-3.5 h-3.5 text-indigo-700" />
                                  Compradores y Deudores
                                </span>
                                <span className="text-[11px] font-semibold text-slate-500">
                                  Quedan {resumenFormUnidades.unidadesSinVender} unid. libres
                                </span>
                              </div>

                              <div className="grid grid-cols-12 gap-2">
                                <input
                                  type="text"
                                  placeholder="Nombre persona..."
                                  value={nuevoCompNombre}
                                  onChange={(e) => setNuevoCompNombre(e.target.value)}
                                  className="col-span-5 px-2.5 py-2 rounded-lg border border-slate-300 bg-white text-xs outline-none focus:border-indigo-600"
                                />
                                <input
                                  type="number"
                                  min="1"
                                  placeholder="Cant."
                                  value={nuevoCompCantidad}
                                  onChange={(e) => setNuevoCompCantidad(e.target.value)}
                                  className="col-span-2 px-2 py-2 rounded-lg border border-slate-300 bg-white text-xs font-bold text-center outline-none focus:border-indigo-600"
                                />
                                <select
                                  value={nuevoCompEstado}
                                  onChange={(e) => setNuevoCompEstado(e.target.value)}
                                  className="col-span-3 px-1.5 py-2 rounded-lg border border-slate-300 bg-white text-xs font-semibold outline-none"
                                >
                                  <option value="PAGADO">Pagado</option>
                                  <option value="FIADO">Fiado / Abono</option>
                                </select>
                                <button
                                  type="button"
                                  onClick={handleAgregarCompradorForm}
                                  className="col-span-2 bg-indigo-900 hover:bg-indigo-800 text-white rounded-lg flex items-center justify-center transition-colors"
                                  title="Agregar persona"
                                >
                                  <UserPlus className="w-4 h-4" />
                                </button>
                              </div>

                              {nuevoCompEstado === 'FIADO' && (
                                <div className="flex items-center justify-between gap-2 bg-amber-50 p-2 rounded-lg border border-amber-200">
                                  <label className="text-[11px] font-bold text-amber-900">
                                    Abono inicial ($):
                                  </label>
                                  <input
                                    type="number"
                                    min="0"
                                    step="100"
                                    placeholder="0"
                                    value={nuevoCompAbono}
                                    onChange={(e) => setNuevoCompAbono(e.target.value)}
                                    className="w-32 px-2.5 py-1 rounded border border-amber-300 bg-white text-xs font-bold text-right"
                                  />
                                </div>
                              )}

                              {recCompradores.length > 0 && (
                                <div className="max-h-40 overflow-y-auto divide-y divide-slate-200 bg-white rounded-lg border border-slate-200">
                                  {recCompradores.map((c) => {
                                    const totalC = c.cantidad * resumenFormUnidades.precio;
                                    const abonoC =
                                      c.estadoPago === 'PAGADO'
                                        ? totalC
                                        : Math.min(totalC, Number(c.montoAbonado) || 0);
                                    const saldoC = Math.max(0, totalC - abonoC);

                                    return (
                                      <div
                                        key={c.id}
                                        className="px-2.5 py-2 flex items-center justify-between gap-2 text-xs"
                                      >
                                        <div>
                                          <span className="font-bold text-slate-800">
                                            {c.nombre}
                                          </span>
                                          <span className="text-slate-500 ml-1">
                                            ({c.cantidad} unid. = {formatCOP(totalC)})
                                          </span>
                                          {saldoC > 0 && (
                                            <span className="block text-[10px] text-rose-700 font-semibold">
                                              Abonó: {formatCOP(abonoC)} | Debe: {formatCOP(saldoC)}
                                            </span>
                                          )}
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                          <button
                                            type="button"
                                            onClick={() => handleToggleEstadoCompradorForm(c.id)}
                                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                              saldoC === 0
                                                ? 'bg-emerald-100 text-emerald-800'
                                                : 'bg-rose-100 text-rose-800'
                                            }`}
                                          >
                                            {saldoC === 0 ? 'Pagado' : 'Fiado'}
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => handleEliminarCompradorForm(c.id)}
                                            className="text-slate-400 hover:text-rose-600"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>

                            <div className="grid grid-cols-3 gap-2 text-center text-xs">
                              <div className="bg-emerald-50 p-2 rounded-xl border border-emerald-200">
                                <span className="text-[10px] font-bold text-emerald-800 block">
                                  En Mano ({resumenFormUnidades.unidadesPagadas})
                                </span>
                                <span className="font-extrabold text-emerald-900">
                                  {formatCOP(resumenFormUnidades.plataRecaudada)}
                                </span>
                              </div>
                              <div className="bg-rose-50 p-2 rounded-xl border border-rose-200">
                                <span className="text-[10px] font-bold text-rose-800 block">
                                  Fiados ({resumenFormUnidades.unidadesFiadas})
                                </span>
                                <span className="font-extrabold text-rose-900">
                                  {formatCOP(resumenFormUnidades.plataFiada)}
                                </span>
                              </div>
                              <div className="bg-amber-50 p-2 rounded-xl border border-amber-200">
                                <span className="text-[10px] font-bold text-amber-800 block">
                                  Sin Vender ({resumenFormUnidades.unidadesSinVender})
                                </span>
                                <span className="font-extrabold text-amber-900">
                                  {formatCOP(resumenFormUnidades.plataSinVender)}
                                </span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                              Valor Total Recaudado (COP $)
                            </label>
                            <input
                              type="number"
                              min="100"
                              step="100"
                              required
                              placeholder="150000"
                              value={recMonto}
                              onChange={(e) => setRecMonto(e.target.value)}
                              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-600 outline-none"
                            />
                          </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                              Descripción / Detalle
                            </label>
                            <input
                              type="text"
                              placeholder="Opcional en modo unidades..."
                              value={recDescripcion}
                              onChange={(e) => setRecDescripcion(e.target.value)}
                              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-600 outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                              Método de Recaudo
                            </label>
                            <select
                              value={recMetodo}
                              onChange={(e) => setRecMetodo(e.target.value)}
                              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:ring-2 focus:ring-indigo-600 outline-none"
                            >
                              <option value="Efectivo">Efectivo</option>
                              <option value="Transferencia / Nequi">Transferencia / Nequi</option>
                            </select>
                          </div>
                        </div>

                        <button
                          type="submit"
                          className={`w-full py-3 rounded-xl text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 ${
                            editingRecaudoId
                              ? 'bg-amber-600 hover:bg-amber-700'
                              : 'bg-emerald-600 hover:bg-emerald-700'
                          }`}
                        >
                          {editingRecaudoId ? (
                            <>
                              <CheckCircle2 className="w-4 h-4" />
                              Guardar Cambios del Recaudo
                            </>
                          ) : (
                            <>
                              <HandCoins className="w-4 h-4" />
                              Enviar Recaudo a Tesorería
                            </>
                          )}
                        </button>
                      </form>
                    </div>
                  </div>

                  <div className="lg:col-span-7 space-y-4">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h2 className="text-lg font-bold text-slate-900">
                            Historial de Actividades y Cartera
                          </h2>
                          <p className="text-xs text-slate-500">
                            Gestiona abonos de deudores y revisa el estado de entrega al tesorero.
                          </p>
                        </div>
                        <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-900 text-xs font-bold">
                          {movimientos.filter((m) => m.tipo === 'INGRESO').length} registros
                        </span>
                      </div>

                      <div className="space-y-4">
                        {movimientos
                          .filter((m) => m.tipo === 'INGRESO')
                          .map((item) => {
                            const inv = calcularResumenInventario(item);
                            const isExpanded = !!expandedRows[item.id];

                            return (
                              <div
                                key={item.id}
                                className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-white transition-all"
                              >
                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                                  <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="text-xs font-mono font-bold text-indigo-800 bg-indigo-100 px-2 py-0.5 rounded">
                                        {item.id}
                                      </span>
                                      <span className="font-bold text-slate-900 text-sm">
                                        {item.actividad}
                                      </span>
                                      <span className="text-xs text-slate-400">• {item.fecha}</span>
                                    </div>
                                    <p className="text-xs text-slate-600 mt-1">{item.descripcion}</p>
                                    <p className="text-xs font-semibold text-slate-700 mt-1">
                                      Responsable: {item.responsable} ({item.metodoPago})
                                    </p>
                                  </div>

                                  <div className="flex sm:flex-col items-end justify-between gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200">
                                    <div className="text-right">
                                      <span className="text-[11px] text-slate-500 block">
                                        Recaudado en mano:
                                      </span>
                                      <span className="text-lg font-extrabold text-slate-900">
                                        {formatCOP(item.montoReportado)}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2 flex-wrap justify-end">
                                      {item.estado !== 'VERIFICADO' && (
                                        <>
                                          {item.edicionAutorizada ? (
                                            <button
                                              type="button"
                                              onClick={() => handleIniciarEdicionRecaudo(item)}
                                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors animate-pulse"
                                            >
                                              <Edit3 className="w-3 h-3" />
                                              Editar (Autorizado)
                                            </button>
                                          ) : item.solicitudEdicion ? (
                                            <span
                                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300"
                                              title={`Motivo: ${item.motivoEdicion}`}
                                            >
                                              <Clock className="w-3 h-3" />
                                              Esperando permiso Tesorería
                                            </span>
                                          ) : (
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setSolicitudEdicionModal(item);
                                                setMotivoSolicitudEdicion('');
                                              }}
                                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-800 border border-slate-300 transition-colors"
                                            >
                                              <Lock className="w-3 h-3" />
                                              Solicitar Edición
                                            </button>
                                          )}
                                        </>
                                      )}
                                      {renderEstadoBadge(item)}
                                    </div>
                                  </div>
                                </div>

                                {inv.esUnidades && (
                                  <div className="mt-3 pt-3 border-t border-slate-200/80 space-y-2.5">
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                                      <div className="bg-white px-2.5 py-1.5 rounded-lg border border-slate-200">
                                        <span className="text-slate-400 block">Producidas</span>
                                        <span className="font-bold text-slate-800">
                                          {inv.producidas} × {formatCOP(inv.precioUnitario)}
                                        </span>
                                      </div>
                                      <div className="bg-emerald-50/70 px-2.5 py-1.5 rounded-lg border border-emerald-200">
                                        <span className="text-emerald-700 block">
                                          Recaudado ({inv.unidadesPagadas} pag.)
                                        </span>
                                        <span className="font-extrabold text-emerald-900">
                                          {formatCOP(inv.plataPagada)}
                                        </span>
                                      </div>
                                      <div className="bg-rose-50/70 px-2.5 py-1.5 rounded-lg border border-rose-200">
                                        <span className="text-rose-700 block">
                                          Fiados ({inv.unidadesFiadas} unid.)
                                        </span>
                                        <span className="font-extrabold text-rose-900">
                                          {formatCOP(inv.plataFiada)}
                                        </span>
                                      </div>
                                      <div className="bg-amber-50/70 px-2.5 py-1.5 rounded-lg border border-amber-200">
                                        <span className="text-amber-700 block">
                                          Sin vender ({inv.unidadesSinVender} unid.)
                                        </span>
                                        <span className="font-extrabold text-amber-900">
                                          {formatCOP(inv.plataSinVender)}
                                        </span>
                                      </div>
                                    </div>

                                    {item.compradores && item.compradores.length > 0 && (
                                      <div>
                                        <button
                                          type="button"
                                          onClick={() => toggleExpandRow(item.id)}
                                          className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-800 hover:text-indigo-950"
                                        >
                                          <Users className="w-3.5 h-3.5" />
                                          {isExpanded
                                            ? 'Ocultar lista de compradores y deudores'
                                            : `Ver compradores, abonos y deudores (${item.compradores.length})`}
                                          {isExpanded ? (
                                            <ChevronUp className="w-3.5 h-3.5" />
                                          ) : (
                                            <ChevronDown className="w-3.5 h-3.5" />
                                          )}
                                        </button>

                                        {isExpanded && (
                                          <div className="mt-2 bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
                                            {item.compradores.map((c) => {
                                              const totalComp = c.cantidad * inv.precioUnitario;
                                              const abonoActual =
                                                c.estadoPago === 'PAGADO'
                                                  ? totalComp
                                                  : Math.min(
                                                      totalComp,
                                                      Math.max(0, Number(c.montoAbonado) || 0)
                                                    );
                                              const saldoPendiente = Math.max(
                                                0,
                                                totalComp - abonoActual
                                              );

                                              return (
                                                <div
                                                  key={c.id}
                                                  className="px-3 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                                                >
                                                  <div>
                                                    <span className="font-bold text-slate-800">
                                                      {c.nombre}
                                                    </span>
                                                    <span className="text-slate-500 ml-1.5">
                                                      • {c.cantidad} unid. ({formatCOP(totalComp)})
                                                    </span>
                                                    {saldoPendiente > 0 && (
                                                      <div className="text-[11px] mt-0.5 flex flex-wrap gap-2">
                                                        <span className="text-emerald-700 font-semibold">
                                                          Abonado: {formatCOP(abonoActual)}
                                                        </span>
                                                        <span className="text-rose-700 font-bold">
                                                          Debe: {formatCOP(saldoPendiente)}
                                                        </span>
                                                      </div>
                                                    )}
                                                  </div>

                                                  <div className="flex items-center gap-2 self-end sm:self-center">
                                                    {saldoPendiente > 0 && (
                                                      <button
                                                        type="button"
                                                        onClick={() => openAbonoModal(item, c)}
                                                        className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-900 hover:bg-indigo-800 text-white shadow-xs transition-all flex items-center gap-1"
                                                      >
                                                        <BadgeDollarSign className="w-3 h-3 text-emerald-300" />
                                                        Abonar
                                                      </button>
                                                    )}
                                                    <button
                                                      type="button"
                                                      onClick={() =>
                                                        handleTogglePagoCompradorExistente(
                                                          item.id,
                                                          c.id
                                                        )
                                                      }
                                                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all ${
                                                        saldoPendiente === 0
                                                          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                                          : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                                                      }`}
                                                    >
                                                      {saldoPendiente === 0
                                                        ? 'Pagado ✓'
                                                        : 'Saldar Todo'}
                                                    </button>
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

                                {item.notaTesorero && (
                                  <div className="mt-2.5 pt-2 border-t border-slate-200/80 text-xs text-slate-600 flex items-start gap-1.5">
                                    <Info className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                                    <span>
                                      <strong>Nota Tesorería:</strong> {item.notaTesorero}
                                    </span>
                                  </div>
                                )}
                              </div>
                            );
                          })}
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
            {!isTesoreroAuth ? (
              <div className="max-w-md mx-auto mt-10 bg-white rounded-2xl shadow-lg border border-slate-200 p-8 text-center">
                <div className="w-14 h-14 bg-indigo-100 text-indigo-900 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Acceso Exclusivo Tesorería</h2>
                <p className="text-sm text-slate-500 mt-1">
                  Ingresa el PIN de tesorería para custodiar los fondos y llevar el Libro Único.
                </p>

                <form onSubmit={handleTesoreroLogin} className="mt-6 space-y-4">
                  <div>
                    <input
                      type="password"
                      maxLength={12}
                      placeholder="••••"
                      value={pinInput}
                      onChange={(e) => setPinInput(e.target.value)}
                      className="w-full text-center text-2xl tracking-[0.5em] font-bold py-3 px-4 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-600 outline-none"
                      autoFocus
                    />
                    {pinError && (
                      <p className="text-xs text-rose-600 font-semibold mt-2">{pinError}</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-indigo-950 hover:bg-indigo-900 text-white font-bold text-sm shadow-md transition-all"
                  >
                    Desbloquear Libro Único
                  </button>
                </form>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-sm font-bold text-slate-800">
                      Sesión Activa: Tesorero General
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => setShowCambiarPinTesorero(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-900 text-xs font-bold transition-all"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      Cambiar PIN Tesorería
                    </button>
                    <button
                      onClick={handleExportCSV}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Descargar Libro Excel (CSV)
                    </button>
                    <button
                      onClick={() => setShowBorrarTodoModal(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all"
                      title="Borrar todos los registros de tesorería"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Borrar Todo
                    </button>
                    <button
                      onClick={handleResetDemo}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Restaurar Demo
                    </button>
                    <button
                      onClick={() => setIsTesoreroAuth(false)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition-all"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      Bloquear
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        Total Entradas
                      </span>
                      <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                        <TrendingUp className="w-4 h-4" />
                      </div>
                    </div>
                    <p className="text-lg font-extrabold text-slate-900 mt-2">
                      {formatCOP(kpis.totalEntradasVerificadas)}
                    </p>
                    <p className="text-[11px] text-emerald-700 font-medium mt-1">
                      Dinero contado en caja
                    </p>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        Total Salidas
                      </span>
                      <div className="p-1.5 bg-rose-50 text-rose-600 rounded-lg">
                        <TrendingDown className="w-4 h-4" />
                      </div>
                    </div>
                    <p className="text-lg font-extrabold text-rose-600 mt-2">
                      - {formatCOP(kpis.totalSalidas)}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">Gastos e insumos pagados</p>
                  </div>

                  <div className="bg-gradient-to-br from-indigo-950 to-indigo-900 p-4 rounded-2xl shadow-md text-white">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-200">
                        Saldo en Caja
                      </span>
                      <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg">
                        <Wallet className="w-4 h-4" />
                      </div>
                    </div>
                    <p className="text-xl font-extrabold text-emerald-400 mt-2">
                      {formatCOP(kpis.saldoRealEnCaja)}
                    </p>
                    <p className="text-[11px] text-indigo-200 mt-1">Entradas - Salidas</p>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
                        Pendiente Recoger
                      </span>
                      <div className="p-1.5 bg-amber-100 text-amber-700 rounded-lg">
                        <Clock className="w-4 h-4" />
                      </div>
                    </div>
                    <p className="text-lg font-extrabold text-amber-700 mt-2">
                      {formatCOP(kpis.pendientePorRecoger)}
                    </p>
                    <p className="text-[11px] text-amber-700/80 font-medium mt-1">
                      {kpis.cantidadPendientes} entrega(s) por recibir
                    </p>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-indigo-200 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-900">
                        Cartera / En Calle
                      </span>
                      <div className="p-1.5 bg-indigo-100 text-indigo-700 rounded-lg">
                        <ShoppingBag className="w-4 h-4" />
                      </div>
                    </div>
                    <p className="text-lg font-extrabold text-indigo-900 mt-2">
                      {formatCOP(kpis.totalCarteraYSinVender)}
                    </p>
                    <p className="text-[11px] text-indigo-700 font-medium mt-1">
                      Fiados: {formatCOP(kpis.totalPlataFiadaCalle)} | Sin vender:{' '}
                      {formatCOP(kpis.totalPlataSinVenderCalle)}
                    </p>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-rose-200 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-rose-800">
                        Descuadre Revisión
                      </span>
                      <div className="p-1.5 bg-rose-100 text-rose-700 rounded-lg">
                        <AlertTriangle className="w-4 h-4" />
                      </div>
                    </div>
                    <p className="text-lg font-extrabold text-rose-700 mt-2">
                      {formatCOP(kpis.descuadreAcumulado)}
                    </p>
                    <p className="text-[11px] text-rose-700/80 font-medium mt-1">
                      {kpis.cantidadDescuadres} novedad(es) en arqueo
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
                  <button
                    onClick={() => setTesoreroTab('BANDEJA')}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                      tesoreroTab === 'BANDEJA'
                        ? 'bg-indigo-900 text-white shadow-sm'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    <Calculator className="w-4 h-4" />
                    Recepción, Arqueo y Permisos
                    {(kpis.cantidadPendientes > 0 ||
                      kpis.cantidadDescuadres > 0 ||
                      kpis.cantidadSolicitudesEdicion > 0) && (
                      <span className="px-2 py-0.5 text-xs rounded-full bg-amber-400 text-indigo-950 font-extrabold">
                        {kpis.cantidadPendientes +
                          kpis.cantidadDescuadres +
                          kpis.cantidadSolicitudesEdicion}
                      </span>
                    )}
                  </button>

                  <button
                    onClick={() => setTesoreroTab('EGRESOS')}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                      tesoreroTab === 'EGRESOS'
                        ? 'bg-indigo-900 text-white shadow-sm'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    <Receipt className="w-4 h-4" />
                    Registrar Salida / Gasto
                  </button>

                  <button
                    onClick={() => setTesoreroTab('LIBRO')}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                      tesoreroTab === 'LIBRO'
                        ? 'bg-indigo-900 text-white shadow-sm'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    Libro Único Completo ({movimientos.length})
                  </button>
                </div>

                {tesoreroTab === 'BANDEJA' && (
                  <div className="space-y-6">
                    {kpis.cantidadSolicitudesEdicion > 0 && (
                      <div className="bg-indigo-50/80 rounded-2xl border-2 border-indigo-200 p-5 shadow-xs">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="w-5 h-5 text-indigo-800" />
                            <h3 className="font-bold text-indigo-950 text-sm">
                              Solicitudes de Autorización para Modificar Registros ({kpis.cantidadSolicitudesEdicion})
                            </h3>
                          </div>
                          <span className="text-xs font-semibold text-indigo-700">
                            Control de Auditoría
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {movimientos
                            .filter((m) => m.solicitudEdicion)
                            .map((item) => (
                              <div
                                key={item.id}
                                className="bg-white p-4 rounded-xl border border-indigo-200 flex flex-col justify-between gap-3"
                              >
                                <div>
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="text-xs font-mono font-bold bg-indigo-100 text-indigo-900 px-2 py-0.5 rounded">
                                      {item.id} — {item.actividad}
                                    </span>
                                    <span className="text-xs font-bold text-slate-700">
                                      {formatCOP(item.montoReportado)}
                                    </span>
                                  </div>
                                  <p className="text-xs font-semibold text-slate-800 mt-1.5">
                                    Recaudadora: {item.responsable}
                                  </p>
                                  <p className="text-xs text-amber-900 bg-amber-50 p-2 rounded-lg border border-amber-200 mt-1.5">
                                    <strong>Motivo del cambio:</strong> "{item.motivoEdicion}"
                                  </p>
                                </div>

                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleAutorizarEdicionTesorero(item, true)}
                                    className="flex-1 py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5"
                                  >
                                    <Unlock className="w-3.5 h-3.5" />
                                    Autorizar Edición
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleAutorizarEdicionTesorero(item, false)}
                                    className="py-2 px-3 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold"
                                  >
                                    Rechazar
                                  </button>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <Clock className="w-5 h-5 text-amber-600" />
                            <h3 className="font-bold text-slate-900">
                              Pendientes por Recoger ({kpis.cantidadPendientes})
                            </h3>
                          </div>
                          <span className="text-sm font-bold text-amber-700">
                            {formatCOP(kpis.pendientePorRecoger)}
                          </span>
                        </div>

                        {movimientos.filter((m) => m.estado === 'PENDIENTE').length === 0 ? (
                          <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                            <p className="text-sm font-semibold text-slate-700">
                              ¡Todo al día! No hay recaudos pendientes por recoger.
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {movimientos
                              .filter((m) => m.estado === 'PENDIENTE')
                              .map((item) => {
                                const inv = calcularResumenInventario(item);
                                return (
                                  <div
                                    key={item.id}
                                    className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 space-y-2.5"
                                  >
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                      <div>
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <span className="text-xs font-mono font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                                            {item.id}
                                          </span>
                                          <span className="font-bold text-slate-900 text-sm">
                                            {item.actividad}
                                          </span>
                                        </div>
                                        <p className="text-xs text-slate-600 mt-0.5">
                                          {item.descripcion}
                                        </p>
                                        <p className="text-xs font-semibold text-slate-700 mt-1">
                                          Entregará: {item.responsable} ({item.metodoPago}) •{' '}
                                          {item.fecha}
                                        </p>
                                      </div>

                                      <div className="flex sm:flex-col items-end justify-between gap-2">
                                        <span className="text-base font-extrabold text-slate-900">
                                          {formatCOP(item.montoReportado)}
                                        </span>
                                        <button
                                          onClick={() => openArqueoModal(item)}
                                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-900 hover:bg-indigo-800 text-white text-xs font-bold shadow-xs transition-all"
                                        >
                                          <Calculator className="w-3.5 h-3.5 text-emerald-400" />
                                          Recibir y Contar
                                        </button>
                                      </div>
                                    </div>

                                    {inv.esUnidades && inv.totalUnidadesFaltantes > 0 && (
                                      <div className="text-[11px] bg-white/90 px-3 py-2 rounded-lg border border-amber-200/80 text-slate-700 flex flex-wrap justify-between gap-2">
                                        <span>
                                          Fiados: <strong>{inv.unidadesFiadas} unid.</strong> (
                                          {formatCOP(inv.plataFiada)})
                                        </span>
                                        <span>
                                          Sin vender: <strong>{inv.unidadesSinVender} unid.</strong> (
                                          {formatCOP(inv.plataSinVender)})
                                        </span>
                                        <span className="text-amber-900 font-bold">
                                          Falta en calle: {formatCOP(inv.totalPlataFaltante)}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                          </div>
                        )}
                      </div>

                      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-rose-600" />
                            <h3 className="font-bold text-slate-900">
                              Descuadres en Revisión ({kpis.cantidadDescuadres})
                            </h3>
                          </div>
                          <span className="text-sm font-bold text-rose-700">
                            {formatCOP(kpis.descuadreAcumulado)}
                          </span>
                        </div>

                        {movimientos.filter((m) => m.estado === 'DESCUADRE').length === 0 ? (
                          <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                            <ShieldCheck className="w-8 h-8 text-indigo-500 mx-auto mb-2" />
                            <p className="text-sm font-semibold text-slate-700">
                              Sin descuadres pendientes de auditoría.
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {movimientos
                              .filter((m) => m.estado === 'DESCUADRE')
                              .map((item) => {
                                const diferencia = item.montoReportado - item.montoRecibido;
                                return (
                                  <div
                                    key={item.id}
                                    className="p-4 rounded-xl border border-rose-200 bg-rose-50/40 space-y-3"
                                  >
                                    <div className="flex justify-between items-start gap-2">
                                      <div>
                                        <span className="text-xs font-mono font-bold text-rose-800 bg-rose-100 px-2 py-0.5 rounded">
                                          {item.id}
                                        </span>
                                        <h4 className="font-bold text-slate-900 text-sm mt-1">
                                          {item.actividad} — {item.responsable}
                                        </h4>
                                        <p className="text-xs text-slate-600">{item.descripcion}</p>
                                      </div>
                                      <span className="px-2.5 py-1 rounded-lg bg-rose-600 text-white text-xs font-extrabold">
                                        Faltan {formatCOP(diferencia)}
                                      </span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 text-xs bg-white p-2.5 rounded-lg border border-rose-100">
                                      <div>
                                        <span className="text-slate-400 block">Reportado:</span>
                                        <span className="font-bold text-slate-800">
                                          {formatCOP(item.montoReportado)}
                                        </span>
                                      </div>
                                      <div>
                                        <span className="text-slate-400 block">Contado en caja:</span>
                                        <span className="font-bold text-emerald-700">
                                          {formatCOP(item.montoRecibido)}
                                        </span>
                                      </div>
                                    </div>

                                    {item.notaTesorero && (
                                      <p className="text-xs text-rose-800 italic">
                                        "{item.notaTesorero}"
                                      </p>
                                    )}

                                    <div className="flex flex-wrap gap-2 pt-1">
                                      <button
                                        onClick={() => openArqueoModal(item)}
                                        className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold"
                                      >
                                        Recontar Dinero
                                      </button>
                                      <button
                                        onClick={() => handleResolverDescuadre(item)}
                                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                                      >
                                        Aprobar Ajuste y Cerrar Revisión
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {tesoreroTab === 'EGRESOS' && (
                  <div className="max-w-2xl bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="bg-slate-900 px-6 py-4 text-white">
                      <h3 className="font-bold text-base flex items-center gap-2">
                        <ArrowDownRight className="w-5 h-5 text-rose-400" />
                        Registrar Salida de Dinero (Egreso de Caja)
                      </h3>
                      <p className="text-xs text-slate-300 mt-0.5">
                        Todo gasto registrado se descontará automáticamente del Saldo Real en Caja.
                      </p>
                    </div>

                    <form onSubmit={handleRegistrarEgreso} className="p-6 space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold uppercase text-slate-600 mb-1.5">
                            Fecha del Gasto
                          </label>
                          <input
                            type="date"
                            required
                            value={egrFecha}
                            onChange={(e) => setEgrFecha(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold uppercase text-slate-600 mb-1.5">
                            Categoría del Egreso
                          </label>
                          <select
                            value={egrCategoria}
                            onChange={(e) => setEgrCategoria(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white"
                          >
                            {CATEGORIAS_EGRESO.map((cat) => (
                              <option key={cat} value={cat}>
                                {cat}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase text-slate-600 mb-1.5">
                          Concepto / Detalle del Pago
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Ej. Compra de gas, carne y desechables para venta dominical"
                          value={egrConcepto}
                          onChange={(e) => setEgrConcepto(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold uppercase text-slate-600 mb-1.5">
                            Persona que recibe / Autoriza
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="Ej. Hno. Carlos Ruiz"
                            value={egrResponsable}
                            onChange={(e) => setEgrResponsable(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold uppercase text-slate-600 mb-1.5">
                            Valor de Salida (COP $)
                          </label>
                          <input
                            type="number"
                            min="100"
                            step="100"
                            required
                            placeholder="85000"
                            value={egrMonto}
                            onChange={(e) => setEgrMonto(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold text-rose-700"
                          />
                          {egrMonto > 0 && (
                            <p className="text-xs text-rose-600 font-semibold mt-1">
                              {formatCOP(egrMonto)}
                            </p>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase text-slate-600 mb-1.5">
                          Número de Factura o Soporte (Opcional)
                        </label>
                        <input
                          type="text"
                          placeholder="Ej. Recibo #098 de Supermercado"
                          value={egrNota}
                          onChange={(e) => setEgrNota(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow-md transition-all"
                      >
                        Registrar Salida en el Libro Único
                      </button>
                    </form>
                  </div>
                )}

                {tesoreroTab === 'LIBRO' && (
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-5 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">
                          Libro Único de Tesorería
                        </h3>
                        <p className="text-xs text-slate-500">
                          Registro histórico unificado de ingresos, arqueos, descuadres y salidas.
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <div className="relative">
                          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                          <input
                            type="text"
                            placeholder="Buscar actividad o persona..."
                            value={busquedaLibro}
                            onChange={(e) => setBusquedaLibro(e.target.value)}
                            className="pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs w-52 focus:ring-2 focus:ring-indigo-600 outline-none"
                          />
                        </div>

                        <div className="flex items-center gap-1.5">
                          <Filter className="w-4 h-4 text-slate-400" />
                          <select
                            value={filtroLibro}
                            onChange={(e) => setFiltroLibro(e.target.value)}
                            className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white"
                          >
                            <option value="TODOS">Todos los movimientos</option>
                            <option value="VERIFICADO">Solo Entradas Verificadas</option>
                            <option value="PENDIENTE">Pendientes por Recoger</option>
                            <option value="DESCUADRE">Descuadres en Revisión</option>
                            <option value="EGRESOS">Solo Salidas / Egresos</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-100 text-slate-600 text-[11px] uppercase tracking-wider border-b border-slate-200">
                            <th className="py-3.5 px-4 font-bold">Fecha / ID</th>
                            <th className="py-3.5 px-4 font-bold">Actividad / Concepto</th>
                            <th className="py-3.5 px-4 font-bold">Responsable</th>
                            <th className="py-3.5 px-4 font-bold text-right">Reportado</th>
                            <th className="py-3.5 px-4 font-bold text-right text-emerald-800">
                              Entrada Real
                            </th>
                            <th className="py-3.5 px-4 font-bold text-right text-rose-800">
                              Salida
                            </th>
                            <th className="py-3.5 px-4 font-bold">Estado</th>
                            <th className="py-3.5 px-4 font-bold text-center">Acción</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                          {movimientosFiltrados.map((m) => {
                            const inv = calcularResumenInventario(m);
                            const isExpanded = !!expandedRows[m.id];

                            return (
                              <React.Fragment key={m.id}>
                                <tr className="hover:bg-slate-50/80 transition-colors">
                                  <td className="py-3.5 px-4 whitespace-nowrap">
                                    <div className="font-semibold text-slate-800 text-xs">
                                      {m.fecha}
                                    </div>
                                    <div className="font-mono text-[11px] text-slate-400">{m.id}</div>
                                  </td>
                                  <td className="py-3.5 px-4 max-w-xs">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="font-bold text-slate-900 text-xs">
                                        {m.actividad}
                                      </span>
                                      {inv.esUnidades && (
                                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-800 border border-indigo-200">
                                          {inv.unidadesPagadas}/{inv.producidas} unid. pagadas
                                        </span>
                                      )}
                                    </div>
                                    <div
                                      className="text-xs text-slate-600 truncate"
                                      title={m.descripcion}
                                    >
                                      {m.descripcion}
                                    </div>
                                    {inv.esUnidades && inv.totalUnidadesFaltantes > 0 && (
                                      <div className="text-[11px] font-semibold text-amber-800 mt-0.5">
                                        Faltan {inv.totalUnidadesFaltantes} unid. por recoger (
                                        {formatCOP(inv.totalPlataFaltante)})
                                      </div>
                                    )}
                                    {inv.esUnidades &&
                                      m.compradores &&
                                      m.compradores.length > 0 && (
                                        <button
                                          type="button"
                                          onClick={() => toggleExpandRow(m.id)}
                                          className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 hover:underline"
                                        >
                                          <Users className="w-3 h-3" />
                                          {isExpanded
                                            ? 'Ocultar compradores'
                                            : `Ver ${m.compradores.length} compradores/deudores`}
                                        </button>
                                      )}
                                    {m.notaTesorero && (
                                      <div className="text-[11px] text-indigo-700 mt-0.5 italic">
                                        Nota: {m.notaTesorero}
                                      </div>
                                    )}
                                  </td>
                                  <td className="py-3.5 px-4 whitespace-nowrap text-xs font-medium text-slate-700">
                                    {m.responsable}
                                  </td>
                                  <td className="py-3.5 px-4 whitespace-nowrap text-right text-xs text-slate-500 font-medium">
                                    {m.tipo === 'INGRESO' ? formatCOP(m.montoReportado) : '—'}
                                  </td>
                                  <td className="py-3.5 px-4 whitespace-nowrap text-right text-xs font-extrabold text-emerald-700">
                                    {m.montoRecibido > 0 ? `+ ${formatCOP(m.montoRecibido)}` : '—'}
                                  </td>
                                  <td className="py-3.5 px-4 whitespace-nowrap text-right text-xs font-extrabold text-rose-600">
                                    {m.montoSalida > 0 ? `- ${formatCOP(m.montoSalida)}` : '—'}
                                  </td>
                                  <td className="py-3.5 px-4 whitespace-nowrap">
                                    {renderEstadoBadge(m)}
                                  </td>
                                  <td className="py-3.5 px-4 whitespace-nowrap text-center">
                                    {(m.estado === 'PENDIENTE' || m.estado === 'DESCUADRE') && (
                                      <button
                                        onClick={() => openArqueoModal(m)}
                                        className="px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-800 text-xs font-bold transition-colors"
                                      >
                                        Arqueo
                                      </button>
                                    )}
                                  </td>
                                </tr>

                                {inv.esUnidades &&
                                  isExpanded &&
                                  m.compradores &&
                                  m.compradores.length > 0 && (
                                    <tr className="bg-indigo-50/40">
                                      <td colSpan={8} className="px-6 py-3">
                                        <div className="bg-white rounded-xl border border-indigo-100 p-3">
                                          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 mb-2 border-b border-slate-100 text-xs">
                                            <span className="font-bold text-indigo-950">
                                              Detalle de Inventario y Compradores — {m.actividad} (
                                              {inv.producidas} producidas ×{' '}
                                              {formatCOP(inv.precioUnitario)})
                                            </span>
                                            <div className="flex gap-3 text-[11px] font-bold">
                                              <span className="text-emerald-700">
                                                Pagadas: {inv.unidadesPagadas} (
                                                {formatCOP(inv.plataPagada)})
                                              </span>
                                              <span className="text-rose-700">
                                                Fiadas: {inv.unidadesFiadas} (
                                                {formatCOP(inv.plataFiada)})
                                              </span>
                                              <span className="text-amber-700">
                                                Sin vender: {inv.unidadesSinVender} (
                                                {formatCOP(inv.plataSinVender)})
                                              </span>
                                            </div>
                                          </div>
                                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                            {m.compradores.map((c) => {
                                              const totalC = c.cantidad * inv.precioUnitario;
                                              const abonoC =
                                                c.estadoPago === 'PAGADO'
                                                  ? totalC
                                                  : Math.min(
                                                      totalC,
                                                      Math.max(0, Number(c.montoAbonado) || 0)
                                                    );
                                              const saldoC = Math.max(0, totalC - abonoC);

                                              return (
                                                <div
                                                  key={c.id}
                                                  className="flex items-center justify-between px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50/70 text-xs"
                                                >
                                                  <div>
                                                    <span className="font-bold text-slate-800">
                                                      {c.nombre}
                                                    </span>
                                                    <span className="text-slate-500 block text-[11px]">
                                                      {c.cantidad} unid. ({formatCOP(totalC)})
                                                    </span>
                                                    {saldoC > 0 && abonoC > 0 && (
                                                      <span className="text-[10px] font-bold text-indigo-700 block">
                                                        Abonó: {formatCOP(abonoC)} | Debe:{' '}
                                                        {formatCOP(saldoC)}
                                                      </span>
                                                    )}
                                                  </div>
                                                  <span
                                                    className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                                                      saldoC === 0
                                                        ? 'bg-emerald-100 text-emerald-800'
                                                        : 'bg-rose-100 text-rose-800'
                                                    }`}
                                                  >
                                                    {saldoC === 0 ? 'PAGADO' : 'FIADO'}
                                                  </span>
                                                </div>
                                              );
                                            })}
                                          </div>
                                        </div>
                                      </td>
                                    </tr>
                                  )}
                              </React.Fragment>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>

      {showCambiarPinRecaudador && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-indigo-950 px-6 py-4 text-white flex items-center justify-between">
              <h3 className="font-bold text-base">Cambiar Contraseña Recaudador</h3>
              <button onClick={() => setShowCambiarPinRecaudador(false)} className="text-indigo-200 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleGuardarNuevoPinRec} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">
                  Nueva Contraseña / PIN
                </label>
                <input
                  type="password"
                  required
                  placeholder="Nueva contraseña..."
                  value={nuevoPinRecInput}
                  onChange={(e) => setNuevoPinRecInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-indigo-600"
                  autoFocus
                />
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowCambiarPinRecaudador(false)}
                  className="flex-1 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-indigo-900 text-white text-xs font-bold"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCambiarPinTesorero && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-indigo-950 px-6 py-4 text-white flex items-center justify-between">
              <h3 className="font-bold text-base">Cambiar PIN Tesorería</h3>
              <button onClick={() => setShowCambiarPinTesorero(false)} className="text-indigo-200 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleGuardarNuevoPinTes} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">
                  Nuevo PIN Tesorería
                </label>
                <input
                  type="password"
                  required
                  placeholder="Nuevo PIN..."
                  value={nuevoPinTesInput}
                  onChange={(e) => setNuevoPinTesInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-indigo-600"
                  autoFocus
                />
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowCambiarPinTesorero(false)}
                  className="flex-1 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-indigo-900 text-white text-xs font-bold"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showBorrarTodoModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-rose-900 px-6 py-4 text-white flex items-center justify-between">
              <h3 className="font-bold text-base flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-300" />
                Confirmar Borrado Total
              </h3>
              <button onClick={() => setShowBorrarTodoModal(false)} className="text-rose-200 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4 text-sm text-slate-600">
              <p>
                Estás a punto de eliminar <strong>todos los registros y movimientos</strong> del Libro Único de Tesorería de forma permanente.
              </p>
              <p className="text-xs text-rose-700 bg-rose-50 p-3 rounded-xl border border-rose-200 font-semibold">
                Esta acción no se puede deshacer. ¿Estás completamente seguro?
              </p>
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBorrarTodoModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleBorrarTodoContenido}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold shadow-md"
                >
                  Sí, Borrar Todo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {solicitudEdicionModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-indigo-950 px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base">Solicitar Permiso de Edición</h3>
              </div>
              <button
                type="button"
                onClick={() => setSolicitudEdicionModal(null)}
                className="text-indigo-200 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEnviarSolicitudEdicion} className="p-6 space-y-4">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-1">
                <p className="font-bold text-slate-900">
                  Registro: {solicitudEdicionModal.id} — {solicitudEdicionModal.actividad}
                </p>
                <p className="text-slate-600">
                  Monto reportado actual: <strong>{formatCOP(solicitudEdicionModal.montoReportado)}</strong>
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">
                  Motivo de la corrección
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Ej. Me equivoqué en la cantidad..."
                  value={motivoSolicitudEdicion}
                  onChange={(e) => setMotivoSolicitudEdicion(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs outline-none focus:ring-2 focus:ring-indigo-600"
                  autoFocus
                />
              </div>

              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setSolicitudEdicionModal(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-indigo-900 hover:bg-indigo-800 text-white text-sm font-bold shadow-md"
                >
                  Enviar Solicitud
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {abonoModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-indigo-950 px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BadgeDollarSign className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-base">Registrar Abono de Deudor</h3>
              </div>
              <button
                type="button"
                onClick={() => setAbonoModal(null)}
                className="text-indigo-200 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmarAbono} className="p-6 space-y-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Deudor:</span>
                  <span className="font-bold text-slate-900 text-sm">
                    {abonoModal.comprador.nombre}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Actividad:</span>
                  <span className="font-semibold text-slate-700">
                    {abonoModal.actividad} ({abonoModal.comprador.cantidad} unid.)
                  </span>
                </div>
                <div className="flex justify-between pt-1.5 border-t border-slate-200 text-sm">
                  <span className="font-extrabold text-rose-800">Saldo Pendiente:</span>
                  <span className="font-extrabold text-rose-700">
                    {formatCOP(abonoModal.saldoPendiente)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">
                  Valor del Abono a Registrar ($)
                </label>
                <input
                  type="number"
                  min="100"
                  max={abonoModal.saldoPendiente}
                  step="100"
                  required
                  value={valorAbonoInput}
                  onChange={(e) => setValorAbonoInput(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-indigo-200 focus:border-indigo-600 text-lg font-extrabold text-slate-900 outline-none"
                  autoFocus
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setAbonoModal(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-md"
                >
                  Guardar Abono
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {arqueoItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col">
            <div className="bg-indigo-950 px-6 py-4 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-base">Arqueo y Recepción de Recaudo</h3>
              </div>
              <button
                onClick={() => setArqueoItem(null)}
                className="text-indigo-200 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmarArqueo} className="p-6 space-y-4 overflow-y-auto">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5">
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Registro: {arqueoItem.id}</span>
                  <span>{arqueoItem.fecha}</span>
                </div>
                <p className="font-bold text-slate-900 text-sm">
                  {arqueoItem.actividad} — {arqueoItem.responsable}
                </p>
                <p className="text-xs text-slate-600">{arqueoItem.descripcion}</p>
                <div className="pt-2 mt-2 border-t border-slate-200 flex justify-between items-center">
                  <span className="text-xs font-semibold text-slate-600">
                    Monto Reportado en Mano por Recaudador:
                  </span>
                  <span className="text-base font-extrabold text-indigo-950">
                    {formatCOP(arqueoItem.montoReportado)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">
                  Monto Físico Contado por el Tesorero ($)
                </label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  required
                  value={montoFisicoContado}
                  onChange={(e) => setMontoFisicoContado(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-indigo-200 focus:border-indigo-600 text-lg font-extrabold text-slate-900 outline-none"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1.5">
                  Observación / Nota de Tesorería
                </label>
                <textarea
                  rows={2}
                  placeholder="Ej. Contado en presencia del recaudador, sin novedad."
                  value={notaArqueo}
                  onChange={(e) => setNotaArqueo(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setArqueoItem(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-md"
                >
                  Confirmar Recepción
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}