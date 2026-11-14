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
    agotado: unidadesSinVender === 0,
  };
};

const ACTIVIDADES_RECAUDO = [
  'Tamales / Bollos',
  'Venta de Comidas',
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
  const [movimientos, setMovimientos] = useState([]);
  const [pinRecaudador, setPinRecaudador] = useState('2026');
  const [pinTesorero, setPinTesorero] = useState('1234');
  const [cargandoNube, setCargandoNube] = useState(true);

  useEffect(() => {
    supabase
      .from('estado_tesoreria')
      .select('datos, pin_rec, pin_tes')
      .eq('id', 1)
      .single()
      .then(({ data }) => {
        if (data) {
          if (data.datos) setMovimientos(Array.isArray(data.datos) ? data.datos : []);
          if (data.pin_rec) setPinRecaudador(data.pin_rec);
          if (data.pin_tes) setPinTesorero(data.pin_tes);
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
            if (payload.new.pin_rec) setPinRecaudador(payload.new.pin_rec);
            if (payload.new.pin_tes) setPinTesorero(payload.new.pin_tes);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canalRealtime);
    };
  }, []);

  const guardarEnNube = (nuevosMovs, nuevoPinR, nuevoPinT) => {
    if (cargandoNube) return;
    try {
      supabase
        .from('estado_tesoreria')
        .upsert({ id: 1, datos: nuevosMovs, pin_rec: nuevoPinR, pin_tes: nuevoPinT })
        .then(({ error }) => {
          if (error) console.error('Error al guardar en Supabase:', error);
        });
    } catch (err) {
      console.error(err);
    }
  };

  const [activeRole, setActiveRole] = useState('RECAUDADOR');
  const [isRecaudadorAuth, setIsRecaudadorAuth] = useState(false);
  const [recPinInput, setRecPinInput] = useState('');
  const [recPinError, setRecPinError] = useState('');

  const [isTesoreroAuth, setIsTesoreroAuth] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4500);
  };

  const [showCambiarPinRecaudador, setShowCambiarPinRecaudador] = useState(false);
  const [nuevoPinRecInput, setNuevoPinRecInput] = useState('');
  const [showCambiarPinTesorero, setShowCambiarPinTesorero] = useState(false);
  const [nuevoPinTesInput, setNuevoPinTesInput] = useState('');
  const [showBorrarTodoModal, setShowBorrarTodoModal] = useState(false);

  // Estados Formulario Recaudador
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
  const [expandedRows, setExpandedRows] = useState({});

  // Estados Tesorería
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

  const toggleExpandRow = (id) => {
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleGuardarNuevoPinRec = (e) => {
    e.preventDefault();
    if (!nuevoPinRecInput.trim()) return;
    const nuevo = nuevoPinRecInput.trim();
    setPinRecaudador(nuevo);
    setShowCambiarPinRecaudador(false);
    setNuevoPinRecInput('');
    guardarEnNube(movimientos, nuevo, pinTesorero);
    showToast('PIN de Recaudador actualizado.');
  };

  const handleGuardarNuevoPinTes = (e) => {
    e.preventDefault();
    if (!nuevoPinTesInput.trim()) return;
    const nuevo = nuevoPinTesInput.trim();
    setPinTesorero(nuevo);
    setShowCambiarPinTesorero(false);
    setNuevoPinTesInput('');
    guardarEnNube(movimientos, pinRecaudador, nuevo);
    showToast('PIN de Tesorería actualizado.');
  };

  const handleBorrarTodo = () => {
    setMovimientos([]);
    setShowBorrarTodoModal(false);
    guardarEnNube([], pinRecaudador, pinTesorero);
    showToast('Se han borrado todos los registros.', 'warning');
  };

  const resumenFormUnidades = useMemo(() => {
    const producidas = Number(recCantidadProducida) || 0;
    const precio = Number(recPrecioUnitario) || 0;
    const totalEsperado = producidas * precio;

    let unidadesPagadas = 0;
    let unidadesFiadas = 0;
    let plataRecaudada = 0;
    let plataFiada = 0;

    recCompradores.forEach((c) => {
      const q = Number(c.cantidad) || 0;
      const totalComp = q * precio;
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
      plataPagada,
      unidadesFiadas,
      plataFiada,
      unidadesSinVender,
      plataSinVender,
      totalUnidadesFaltantes,
      totalPlataFaltante,
      agotado: unidadesSinVender === 0,
    };
  }, [recCantidadProducida, recPrecioUnitario, recCompradores]);

  const handleAgregarCompradorForm = () => {
    if (resumenFormUnidades.agotado) {
      showToast('¡Inventario agotado! No quedan unidades disponibles para vender o fiar.', 'error');
      return;
    }

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
    if (resumenFormUnidades.unidadesAsignadas + cant > producidas) {
      showToast(`Solo quedan ${resumenFormUnidades.unidadesSinVender} unidades disponibles.`, 'error');
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

  const handleRegistrarRecaudo = (e) => {
    e.preventDefault();
    if (!recNombre.trim()) {
      showToast('Ingresa el nombre del responsable.', 'error');
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
                actividad: recActividad,
                descripcion: descFinal,
                responsable: recNombre.trim(),
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
        guardarEnNube(actualizados, pinRecaudador, pinTesorero);
        setEditingRecaudoId(null);
        setRecDescripcion('');
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
        actividad: recActividad,
        descripcion: descFinal,
        responsable: recNombre.trim(),
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
      guardarEnNube(actualizados, pinRecaudador, pinTesorero);
      setExpandedRows((prev) => ({ ...prev, [nuevoId]: true }));
      setRecDescripcion('');
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
              actividad: recActividad,
              descripcion: recDescripcion.trim(),
              responsable: recNombre.trim(),
              metodoPago: recMetodo,
              montoReportado: valor,
              edicionAutorizada: false,
              solicitudEdicion: false,
              motivoEdicion: '',
            }
          : m
      );
      setMovimientos(actualizados);
      guardarEnNube(actualizados, pinRecaudador, pinTesorero);
      setEditingRecaudoId(null);
      setRecDescripcion('');
      setRecMonto('');
      showToast('Recaudo general modificado.');
      return;
    }

    const nuevoReg = {
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

    const actualizados = [nuevoReg, ...movimientos];
    setMovimientos(actualizados);
    guardarEnNube(actualizados, pinRecaudador, pinTesorero);
    setRecDescripcion('');
    setRecMonto('');
    showToast('Recaudo general enviado a Tesorería.');
  };

  const handleIniciarEdicion = (item) => {
    if (item.estado === 'VERIFICADO') {
      showToast('Ya fue verificado por tesorería, no se puede editar.', 'warning');
      return;
    }
    if (!item.edicionAutorizada) {
      showToast('Necesitas solicitar autorización de edición a Tesorería.', 'warning');
      return;
    }
    setEditingRecaudoId(item.id);
    setRecFecha(item.fecha);
    setRecActividad(item.actividad);
    setRecNombre(item.responsable);
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
    showToast('Modo edición activado. Puedes modificar compradores, deudas y abonos.');
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
    guardarEnNube(actualizados, pinRecaudador, pinTesorero);
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
    guardarEnNube(actualizados, pinRecaudador, pinTesorero);
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

      const nuevoMontoReportado = comps.reduce((acc, c) => {
        const totalC = (Number(c.cantidad) || 0) * precio;
        const abonoC =
          c.estadoPago === 'PAGADO'
            ? totalC
            : Math.min(totalC, Math.max(0, Number(c.montoAbonado) || 0));
        return acc + abonoC;
      }, 0);

      return { ...m, compradores: comps, montoReportado: nuevoMontoReportado };
    });

    setMovimientos(actualizados);
    guardarEnNube(actualizados, pinRecaudador, pinTesorero);
    showToast(`Abono de ${formatCOP(abonoNuevo)} registrado con éxito.`);
    setAbonoModal(null);
  };

  const handleSaldarTodoComprador = (movimientoId, compradorId) => {
    const actualizados = movimientos.map((m) => {
      if (m.id !== movimientoId || m.modoRegistro !== 'UNIDADES') return m;
      const precio = Number(m.precioUnitario) || 0;
      const comps = (m.compradores || []).map((c) => {
        if (c.id !== compradorId) return c;
        const totalC = (Number(c.cantidad) || 0) * precio;
        return { ...c, estadoPago: 'PAGADO', montoAbonado: totalC };
      });
      const nuevoMontoReportado = comps.reduce((acc, c) => {
        const totalC = (Number(c.cantidad) || 0) * precio;
        return acc + totalC;
      }, 0);
      return { ...m, compradores: comps, montoReportado: nuevoMontoReportado };
    });
    setMovimientos(actualizados);
    guardarEnNube(actualizados, pinRecaudador, pinTesorero);
    showToast('Deuda saldada por completo.');
  };

  const handleTogglePagoCompradorExistente = (movimientoId, compradorId) => {
    const actualizados = movimientos.map((m) => {
      if (m.id !== movimientoId || m.modoRegistro !== 'UNIDADES') return m;
      const precio = Number(m.precioUnitario) || 0;
      const comps = (m.compradores || []).map((c) => {
        if (c.id !== compradorId) return c;
        const nuevoEstado = c.estadoPago === 'PAGADO' ? 'FIADO' : 'PAGADO';
        return {
          ...c,
          estadoPago: nuevoEstado,
          montoAbonado: nuevoEstado === 'PAGADO' ? (Number(c.cantidad) || 0) * precio : 0,
        };
      });
      const nuevoMontoReportado = comps.reduce((acc, c) => {
        const totalC = (Number(c.cantidad) || 0) * precio;
        const abonoC =
          c.estadoPago === 'PAGADO'
            ? totalC
            : Math.min(totalC, Math.max(0, Number(c.montoAbonado) || 0));
        return acc + abonoC;
      }, 0);
      return { ...m, compradores: comps, montoReportado: nuevoMontoReportado };
    });
    setMovimientos(actualizados);
    guardarEnNube(actualizados, pinRecaudador, pinTesorero);
    showToast('Estado de pago actualizado.');
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

    movimientos.forEach((m) => {
      if (m.tipo === 'INGRESO') {
        if (m.estado === 'VERIFICADO') {
          totalEntradasVerificadas += Number(m.montoRecibido) || 0;
        } else if (m.estado === 'PENDIENTE') {
          pendientePorRecoger += Number(m.montoReportado) || 0;
          cantidadPendientes += 1;
        } else if (m.estado === 'DESCUADRE') {
          totalEntradasVerificadas += Number(m.montoRecibido) || 0;
          const diff = Math.abs((Number(m.montoReportado) || 0) - (Number(m.montoRecibido) || 0));
          descuadreAcumulado += diff;
          cantidadDescuadres += 1;
        }
        if (m.solicitudEdicion) cantidadSolicitudesEdicion += 1;

        if (m.modoRegistro === 'UNIDADES') {
          const inv = calcularResumenInventario(m);
          totalPlataFiadaCalle += inv.plataFiada;
          totalPlataSinVenderCalle += inv.plataSinVender;
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
      totalCarteraYSinVender,
    };
  }, [movimientos]);

  const handleRecaudadorLogin = (e) => {
    e.preventDefault();
    if (recPinInput.trim() === pinRecaudador) {
      setIsRecaudadorAuth(true);
      setRecPinError('');
      setRecPinInput('');
      showToast('Acceso de recaudador concedido.');
    } else {
      setRecPinError('Contraseña incorrecta.');
    }
  };

  const handleTesoreroLogin = (e) => {
    e.preventDefault();
    if (pinInput.trim() === pinTesorero) {
      setIsTesoreroAuth(true);
      setPinError('');
      setPinInput('');
      showToast('Acceso de tesorería concedido.');
    } else {
      setPinError('Contraseña incorrecta.');
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
              ? 'Dinero contado exacto en sobre sellado.'
              : `Se reportaron ${formatCOP(reportado)}, pero al contar faltaron ${formatCOP(reportado - contado)}.`),
        };
      }
      return m;
    });

    setMovimientos(actualizados);
    guardarEnNube(actualizados, pinRecaudador, pinTesorero);
    setArqueoItem(null);
    showToast(esExacto ? 'Recaudo verificado y recibido en caja.' : 'Arqueo guardado con descuadre.');
  };

  const handleAprobarAjusteDescuadre = (item) => {
    const actualizados = movimientos.map((m) => {
      if (m.id === item.id) {
        return {
          ...m,
          montoReportado: m.montoRecibido,
          estado: 'VERIFICADO',
          notaTesorero: `${m.notaTesorero} [Ajuste aprobado por Tesorería]`,
        };
      }
      return m;
    });
    setMovimientos(actualizados);
    guardarEnNube(actualizados, pinRecaudador, pinTesorero);
    showToast('Ajuste de descuadre aprobado y cerrado.');
  };

  const handleRegistrarEgreso = (e) => {
    e.preventDefault();
    const valor = Number(egrMonto.toString().replace(/\D/g, ''));
    if (!egrConcepto.trim() || !egrResponsable.trim() || valor <= 0) {
      showToast('Completa todos los campos del egreso.', 'error');
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

    const actualizados = [nuevoEgreso, ...movimientos];
    setMovimientos(actualizados);
    guardarEnNube(actualizados, pinRecaudador, pinTesorero);
    setEgrConcepto('');
    setEgrMonto('');
    setEgrNota('');
    showToast(`Salida registrada por ${formatCOP(valor)}.`);
    setTesoreroTab('LIBRO');
  };

  const handleExportCSV = () => {
    const headers = [
      'ID', 'Fecha', 'Tipo', 'Actividad', 'Descripción', 'Responsable', 'Reportado', 'Entrada Real', 'Salida', 'Estado', 'Nota'
    ];
    const rows = movimientos.map((m) => [
      m.id, m.fecha, m.tipo, `"${m.actividad}"`, `"${m.descripcion}"`, `"${m.responsable}"`,
      m.montoReportado, m.montoRecibido, m.montoSalida, m.estado, `"${m.notaTesorero || ''}"`
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
            Pendiente por recoger
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

      {/* HEADER PRINCIPAL */}
      <header className="bg-indigo-950 text-white shadow-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-800 p-2.5 rounded-xl border border-indigo-700 shadow-inner">
                <Wallet className="w-7 h-7 text-emerald-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-white">
                  Tesorería & Recaudos Eclesiásticos
                </h1>
                <p className="text-xs text-indigo-200">
                  Sincronizado en tiempo real por Supabase • Multidispositivo
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-indigo-900/90 p-1.5 rounded-xl border border-indigo-800">
              <button
                onClick={() => setActiveRole('RECAUDADOR')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  activeRole === 'RECAUDADOR'
                    ? 'bg-white text-indigo-950 shadow-sm'
                    : 'text-indigo-200 hover:text-white hover:bg-indigo-800/50'
                }`}
              >
                {isRecaudadorAuth ? <Unlock className="w-4 h-4 text-emerald-600" /> : <Lock className="w-4 h-4" />}
                <span>Módulo Recaudadores</span>
              </button>

              <button
                onClick={() => setActiveRole('TESORERO')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  activeRole === 'TESORERO'
                    ? 'bg-emerald-500 text-indigo-950 shadow-sm'
                    : 'text-indigo-200 hover:text-white hover:bg-indigo-800/50'
                }`}
              >
                {isTesoreroAuth ? <Unlock className="w-4 h-4 text-indigo-950" /> : <Lock className="w-4 h-4" />}
                <span>Tesorería Central</span>
                {kpis.cantidadPendientes > 0 && (
                  <span className="ml-1 px-2 py-0.5 text-xs font-bold rounded-full bg-amber-400 text-indigo-950">
                    {kpis.cantidadPendientes}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* ================= MODULO RECAUDADOR ================= */}
        {activeRole === 'RECAUDADOR' && (
          <>
            {!isRecaudadorAuth ? (
              <div className="max-w-md mx-auto mt-16 bg-white rounded-2xl shadow-xl border border-slate-200 p-8 text-center">
                <div className="w-14 h-14 bg-indigo-100 text-indigo-900 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
                  <HandCoins className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Acceso Recaudadores</h2>
                <p className="text-sm text-slate-500 mt-1">Ingresa el PIN de seguridad asignado.</p>

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
                    Ingresar al Módulo
                  </button>
                </form>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-sm font-bold text-slate-800">Recaudador Autorizado (Sincronizado)</span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => setShowCambiarPinRecaudador(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-900 text-xs font-bold transition-all"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      Cambiar PIN
                    </button>
                    <button
                      onClick={() => setIsRecaudadorAuth(false)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition-all"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      Cerrar Sesión
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  {/* FORMULARIO */}
                  <div className="lg:col-span-5">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden sticky top-24">
                      <div className={`px-6 py-4 text-white ${editingRecaudoId ? 'bg-amber-700' : 'bg-indigo-950'}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {editingRecaudoId ? <Edit3 className="w-5 h-5 text-amber-300" /> : <PlusCircle className="w-5 h-5 text-emerald-400" />}
                            <h2 className="font-bold text-base">
                              {editingRecaudoId ? 'Modificar Recaudo' : 'Registrar Recaudo de Actividad'}
                            </h2>
                          </div>
                          {editingRecaudoId && (
                            <button
                              onClick={() => {
                                setEditingRecaudoId(null);
                                setRecDescripcion('');
                                setRecCompradores([]);
                              }}
                              className="px-2.5 py-1 rounded bg-white/20 text-xs font-bold hover:bg-white/30"
                            >
                              Cancelar
                            </button>
                          )}
                        </div>
                        <p className="text-xs text-indigo-200 mt-0.5">
                          Registra ventas por unidades (con deudores/abonos) o recaudos generales.
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
                            <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Actividad</label>
                            <select
                              value={recActividad}
                              onChange={(e) => setRecActividad(e.target.value)}
                              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white font-medium"
                            >
                              {ACTIVIDADES_RECAUDO.map((act) => (
                                <option key={act} value={act}>{act}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Nombre del Recaudador Responsable</label>
                          <input
                            type="text"
                            required
                            placeholder="Ej. Hna. Marta Gómez"
                            value={recNombre}
                            onChange={(e) => setRecNombre(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                          />
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

                            {/* TARJETAS DE RESUMEN EN VIVO DE CAJA */}
                            <div className="grid grid-cols-3 gap-2">
                              <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl text-center">
                                <span className="text-[10px] font-bold uppercase text-emerald-800 block">En Mano</span>
                                <span className="text-xs font-extrabold text-emerald-950">{formatCOP(resumenFormUnidades.plataRecaudada)}</span>
                              </div>
                              <div className="bg-rose-50 border border-rose-200 p-2.5 rounded-xl text-center">
                                <span className="text-[10px] font-bold uppercase text-rose-800 block">Fiados ({resumenFormUnidades.unidadesFiadas})</span>
                                <span className="text-xs font-extrabold text-rose-950">{formatCOP(resumenFormUnidades.plataFiada)}</span>
                              </div>
                              <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-xl text-center">
                                <span className="text-[10px] font-bold uppercase text-amber-800 block">Sin Vender</span>
                                <span className="text-xs font-extrabold text-amber-950">{formatCOP(resumenFormUnidades.plataSinVender)}</span>
                              </div>
                            </div>

                            {/* AVISO SI ESTÁ AGOTADO */}
                            {resumenFormUnidades.agotado && (
                              <div className="bg-rose-100 border border-rose-300 text-rose-900 px-3 py-2 rounded-xl text-xs font-bold text-center animate-pulse">
                                ⚠️ ¡Inventario Agotado! No quedan unidades disponibles para vender o fiar.
                              </div>
                            )}

                            {/* SECCION COMPRADORES */}
                            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold uppercase text-slate-700 flex items-center gap-1.5">
                                  <Users className="w-3.5 h-3.5 text-indigo-700" />
                                  Compradores y Deudores
                                </span>
                                <span className="text-[11px] font-semibold text-slate-500">Quedan {resumenFormUnidades.unidadesSinVender} unid. libres</span>
                              </div>

                              <div className="grid grid-cols-12 gap-2">
                                <input
                                  type="text"
                                  placeholder="Nombre persona..."
                                  value={nuevoCompNombre}
                                  onChange={(e) => setNuevoCompNombre(e.target.value)}
                                  disabled={resumenFormUnidades.agotado}
                                  className="col-span-5 px-2.5 py-2 rounded-lg border border-slate-300 bg-white text-xs disabled:bg-slate-100"
                                />
                                <input
                                  type="number"
                                  min="1"
                                  value={nuevoCompCantidad}
                                  onChange={(e) => setNuevoCompCantidad(e.target.value)}
                                  disabled={resumenFormUnidades.agotado}
                                  className="col-span-2 px-2 py-2 rounded-lg border border-slate-300 bg-white text-xs font-bold text-center disabled:bg-slate-100"
                                />
                                <select
                                  value={nuevoCompEstado}
                                  onChange={(e) => setNuevoCompEstado(e.target.value)}
                                  disabled={resumenFormUnidades.agotado}
                                  className="col-span-3 px-1 py-2 rounded-lg border border-slate-300 bg-white text-xs font-semibold disabled:bg-slate-100"
                                >
                                  <option value="PAGADO">Pagado</option>
                                  <option value="FIADO">Fiado</option>
                                </select>
                                <button
                                  type="button"
                                  onClick={handleAgregarCompradorForm}
                                  disabled={resumenFormUnidades.agotado}
                                  className="col-span-2 bg-indigo-950 hover:bg-indigo-900 disabled:bg-slate-300 text-white rounded-lg flex items-center justify-center transition-all"
                                  title="Agregar persona"
                                >
                                  <UserPlus className="w-4 h-4" />
                                </button>
                              </div>

                              {nuevoCompEstado === 'FIADO' && !resumenFormUnidades.agotado && (
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
                                <div className="max-h-40 overflow-y-auto divide-y divide-slate-200 bg-white rounded-lg border border-slate-200">
                                  {recCompradores.map((c) => {
                                    const totalC = c.cantidad * resumenFormUnidades.precio;
                                    const abonoC = c.estadoPago === 'PAGADO' ? totalC : Math.min(totalC, Math.max(0, Number(c.montoAbonado) || 0));
                                    const saldoC = Math.max(0, totalC - abonoC);

                                    return (
                                      <div key={c.id} className="px-3 py-2 flex items-center justify-between gap-2 text-xs">
                                        <div>
                                          <span className="font-bold text-slate-800">{c.nombre}</span>
                                          <span className="text-slate-500 ml-1">({c.cantidad} unid)</span>
                                          {saldoC > 0 && (
                                            <span className="block text-[10px] text-rose-700 font-semibold">
                                              Abono: {formatCOP(abonoC)} | Debe: {formatCOP(saldoC)}
                                            </span>
                                          )}
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                          <button
                                            type="button"
                                            onClick={() => handleToggleEstadoCompradorForm(c.id)}
                                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                              saldoC === 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                                            }`}
                                          >
                                            {saldoC === 0 ? 'Pagado ✓' : 'Fiado'}
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

                  {/* HISTORIAL RECAUDADOR */}
                  <div className="lg:col-span-7 space-y-4">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                      <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                        <div>
                          <h2 className="text-base font-bold text-slate-900">Historial de Actividades y Cartera</h2>
                          <p className="text-xs text-slate-500">Gestiona abonos de deudores y revisa el estado de entrega al tesorero.</p>
                        </div>
                        <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-900 text-xs font-bold">
                          {movimientos.filter((m) => m.tipo === 'INGRESO').length} registros
                        </span>
                      </div>

                      <div className="space-y-4">
                        {movimientos.filter((m) => m.tipo === 'INGRESO').length === 0 ? (
                          <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                            <p className="text-sm font-semibold text-slate-600">No hay recaudos registrados todavía.</p>
                          </div>
                        ) : (
                          movimientos
                            .filter((m) => m.tipo === 'INGRESO')
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
                                      <p className="text-xs font-semibold text-slate-700 mt-1">
                                        Responsable: {item.responsable} ({item.metodoPago})
                                      </p>
                                    </div>

                                    <div className="flex sm:flex-col items-end justify-between gap-2 shrink-0">
                                      <div className="text-right">
                                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Recaudado en mano:</span>
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
                                          </>
                                        )}
                                        {renderEstadoBadge(item)}
                                      </div>
                                    </div>
                                  </div>

                                  {item.notaTesorero && (
                                    <div className="bg-indigo-50/80 border border-indigo-100 p-2.5 rounded-xl text-xs text-indigo-950 flex items-start gap-2">
                                      <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                                      <div>
                                        <strong className="font-bold">Nota Tesorería:</strong> {item.notaTesorero}
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
                                          <span className="text-amber-700 block text-[10px]">Sin vender ({inv.unidadesSinVender} unid.)</span>
                                          <span className="font-extrabold text-amber-900">{formatCOP(inv.plataSinVender)}</span>
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
                                            {isExpanded ? 'Ocultar lista de compradores y deudores' : `Ver compradores y deudores (${item.compradores.length})`}
                                          </button>

                                          {isExpanded && (
                                            <div className="mt-2 bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 p-2 space-y-2">
                                              {item.compradores.map((c) => {
                                                const totalComp = c.cantidad * inv.precioUnitario;
                                                const abonoActual = c.estadoPago === 'PAGADO' ? totalComp : Math.min(totalComp, Math.max(0, Number(c.montoAbonado) || 0));
                                                const saldoPendiente = Math.max(0, totalComp - abonoActual);

                                                return (
                                                  <div key={c.id} className="p-2 flex items-center justify-between gap-2 text-xs rounded-lg hover:bg-slate-50">
                                                    <div>
                                                      <span className="font-bold text-slate-800">{c.nombre}</span>
                                                      <span className="text-slate-500 ml-1">• {c.cantidad} unid. ({formatCOP(totalComp)})</span>
                                                      {saldoPendiente > 0 && (
                                                        <span className="block text-[11px] text-rose-700 font-bold">
                                                          Abonado: {formatCOP(abonoActual)} | Debe: {formatCOP(saldoPendiente)}
                                                        </span>
                                                      )}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                      {saldoPendiente > 0 && (
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
                                                        </>
                                                      )}
                                                      <button
                                                        type="button"
                                                        onClick={() => handleTogglePagoCompradorExistente(item.id, c.id)}
                                                        className={`px-3 py-1 rounded-full text-xs font-bold ${
                                                          saldoPendiente === 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                                                        }`}
                                                      >
                                                        {saldoPendiente === 0 ? 'Pagado ✓' : 'Fiado'}
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

        {/* ================= MODULO TESORERO ================= */}
        {activeRole === 'TESORERO' && (
          <>
            {!isTesoreroAuth ? (
              <div className="max-w-md mx-auto mt-16 bg-white rounded-2xl shadow-xl border border-slate-200 p-8 text-center">
                <div className="w-14 h-14 bg-indigo-100 text-indigo-900 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Acceso Tesorería Central</h2>
                <p className="text-sm text-slate-500 mt-1">Ingresa el PIN de tesorería para validar ingresos y arqueos.</p>

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
                    Ingresar a Tesorería
                  </button>
                </form>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-sm font-bold text-slate-800">Tesorero Autorizado (En Línea)</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => setShowCambiarPinTesorero(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-900 text-xs font-bold transition-all"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      Cambiar PIN
                    </button>
                    <button
                      onClick={handleExportCSV}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Descargar Excel
                    </button>
                    <button
                      onClick={() => setShowBorrarTodoModal(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Borrar Todo
                    </button>
                    <button
                      onClick={() => setIsTesoreroAuth(false)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition-all"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      Cerrar Sesión
                    </button>
                  </div>
                </div>

                {/* TARJETAS DE KPIs SUPERIORES */}
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
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Salidas</span>
                      <ArrowDownRight className="w-4 h-4 text-rose-600" />
                    </div>
                    <p className="text-lg font-extrabold text-rose-600 mt-2">- {formatCOP(kpis.totalSalidas)}</p>
                    <span className="text-[10px] text-slate-500 font-semibold mt-1 block">Gastos e insumos pagados</span>
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

                {/* PESTAÑAS DE TESORERÍA */}
                <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
                  <button
                    onClick={() => setTesoreroTab('BANDEJA')}
                    className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                      tesoreroTab === 'BANDEJA' ? 'bg-indigo-950 text-white shadow-xs' : 'bg-white text-slate-600 border hover:bg-slate-50'
                    }`}
                  >
                    <Calculator className="w-4 h-4" />
                    <span>Recepción, Arqueo y Permisos</span>
                    {kpis.cantidadPendientes + kpis.cantidadDescuadres > 0 && (
                      <span className="px-1.5 py-0.5 text-xs rounded-full bg-amber-400 text-indigo-950 font-extrabold">
                        {kpis.cantidadPendientes + kpis.cantidadDescuadres}
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
                    <span>Libro Único Completo ({movimientos.length})</span>
                  </button>
                </div>

                {/* BANDEJA DE RECEPCIÓN Y ARQUEOS */}
                {tesoreroTab === 'BANDEJA' && (
                  <div className="space-y-6">
                    {kpis.cantidadSolicitudesEdicion > 0 && (
                      <div className="bg-indigo-50 rounded-2xl border-2 border-indigo-200 p-5 shadow-sm">
                        <h3 className="font-bold text-indigo-950 text-sm mb-3 flex items-center gap-2">
                          <Edit3 className="w-4 h-4 text-indigo-800" />
                          Solicitudes de Edición Pendientes
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {movimientos
                            .filter((m) => m.solicitudEdicion)
                            .map((item) => (
                              <div key={item.id} className="bg-white p-4 rounded-xl border border-indigo-200 shadow-xs flex flex-col justify-between gap-3">
                                <div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-mono font-bold bg-indigo-100 text-indigo-900 px-2 py-0.5 rounded">
                                      {item.id}
                                    </span>
                                    <span className="text-xs font-semibold text-slate-500">{item.responsable}</span>
                                  </div>
                                  <h4 className="font-bold text-slate-900 text-sm mt-1">{item.actividad}</h4>
                                  <p className="text-xs text-amber-900 bg-amber-50 p-2.5 rounded-lg border border-amber-200 mt-2">
                                    <strong>Motivo:</strong> "{item.motivoEdicion}"
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleAutorizarEdicionTesorero(item, true)}
                                    className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-all"
                                  >
                                    Autorizar Edición
                                  </button>
                                  <button
                                    onClick={() => handleAutorizarEdicionTesorero(item, false)}
                                    className="py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-lg transition-all"
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
                      {/* PENDIENTES POR RECOGER */}
                      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-bold text-slate-900 flex items-center gap-2">
                            <Clock className="w-5 h-5 text-amber-600" />
                            Pendientes por Recoger ({movimientos.filter((m) => m.estado === 'PENDIENTE').length})
                          </h3>
                          <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                            {formatCOP(kpis.pendientePorRecoger)}
                          </span>
                        </div>

                        {movimientos.filter((m) => m.estado === 'PENDIENTE').length === 0 ? (
                          <p className="text-sm text-slate-500 py-10 text-center">No hay recaudos pendientes por recibir.</p>
                        ) : (
                          <div className="space-y-3">
                            {movimientos
                              .filter((m) => m.estado === 'PENDIENTE')
                              .map((item) => {
                                const inv = calcularResumenInventario(item);
                                return (
                                  <div key={item.id} className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs font-mono font-bold text-amber-900 bg-amber-100 px-1.5 py-0.5 rounded">{item.id}</span>
                                        <h4 className="font-bold text-sm text-slate-900">{item.actividad}</h4>
                                      </div>
                                      <p className="text-xs text-slate-600 mt-1">{item.descripcion}</p>
                                      <p className="text-xs font-semibold text-slate-700 mt-0.5">
                                        Entregará: {item.responsable} ({item.metodoPago}) • {item.fecha}
                                      </p>
                                      {inv.esUnidades && (
                                        <div className="text-[11px] text-slate-500 mt-1 flex gap-3">
                                          <span>Fiados: {inv.unidadesFiadas} unid. ({formatCOP(inv.plataFiada)})</span>
                                          <span>Sin vender: {inv.unidadesSinVender} unid. ({formatCOP(inv.plataSinVender)})</span>
                                        </div>
                                      )}
                                    </div>
                                    <div className="text-right shrink-0 w-full sm:w-auto flex sm:flex-col justify-between items-center sm:items-end">
                                      <span className="font-extrabold text-base text-slate-900">{formatCOP(item.montoReportado)}</span>
                                      <button
                                        onClick={() => openArqueoModal(item)}
                                        className="mt-1 px-4 py-2 bg-indigo-950 hover:bg-indigo-900 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5"
                                      >
                                        <Calculator className="w-3.5 h-3.5" />
                                        Recibir y Contar
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                          </div>
                        )}
                      </div>

                      {/* DESCUADRES EN REVISIÓN */}
                      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-bold text-slate-900 flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-rose-600" />
                            Descuadres en Revisión ({movimientos.filter((m) => m.estado === 'DESCUADRE').length})
                          </h3>
                          <span className="text-xs font-bold text-rose-800 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
                            {formatCOP(kpis.descuadreAcumulado)}
                          </span>
                        </div>

                        {movimientos.filter((m) => m.estado === 'DESCUADRE').length === 0 ? (
                          <p className="text-sm text-slate-500 py-10 text-center">No hay descuadres ni novedades en arqueo.</p>
                        ) : (
                          <div className="space-y-3">
                            {movimientos
                              .filter((m) => m.estado === 'DESCUADRE')
                              .map((item) => {
                                const diff = (Number(item.montoReportado) || 0) - (Number(item.montoRecibido) || 0);
                                return (
                                  <div key={item.id} className="p-4 rounded-xl border border-rose-200 bg-rose-50/40 space-y-3">
                                    <div className="flex justify-between items-start">
                                      <div>
                                        <div className="flex items-center gap-2">
                                          <span className="text-xs font-mono font-bold text-rose-900 bg-rose-100 px-1.5 py-0.5 rounded">{item.id}</span>
                                          <h4 className="font-bold text-sm text-slate-900">{item.actividad} — {item.responsable}</h4>
                                        </div>
                                      </div>
                                      <span className="px-2.5 py-1 bg-rose-600 text-white font-extrabold text-xs rounded-lg shadow-xs">
                                        Faltan {formatCOP(Math.abs(diff))}
                                      </span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 text-xs bg-white p-2.5 rounded-lg border border-rose-100">
                                      <div>
                                        <span className="text-slate-400 block text-[10px]">Reportado:</span>
                                        <span className="font-extrabold text-slate-900">{formatCOP(item.montoReportado)}</span>
                                      </div>
                                      <div>
                                        <span className="text-slate-400 block text-[10px]">Contado en caja:</span>
                                        <span className="font-extrabold text-emerald-700">{formatCOP(item.montoRecibido)}</span>
                                      </div>
                                    </div>

                                    <p className="text-xs bg-white p-2.5 rounded-lg border border-rose-200 text-rose-900 font-medium italic">
                                      "{item.notaTesorero}"
                                    </p>

                                    <div className="flex gap-2 pt-1">
                                      <button
                                        onClick={() => openArqueoModal(item)}
                                        className="flex-1 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-bold rounded-xl transition-all"
                                      >
                                        Recontar Dinero
                                      </button>
                                      <button
                                        onClick={() => handleAprobarAjusteDescuadre(item)}
                                        className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all"
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

                {/* REGISTRAR SALIDA / GASTO */}
                {tesoreroTab === 'EGRESOS' && (
                  <div className="max-w-2xl bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="bg-indigo-950 px-6 py-4 text-white">
                      <h3 className="font-bold text-base flex items-center gap-2">
                        <TrendingDown className="w-5 h-5 text-rose-400" />
                        Registrar Salida de Dinero (Egreso de Caja)
                      </h3>
                      <p className="text-xs text-indigo-200 mt-0.5">Todo gasto registrado se descontará automáticamente del Saldo Real en Caja.</p>
                    </div>

                    <form onSubmit={handleRegistrarEgreso} className="p-6 space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Fecha del Gasto</label>
                          <input
                            type="date"
                            required
                            value={egrFecha}
                            onChange={(e) => setEgrFecha(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Categoría del Egreso</label>
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
                        <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Concepto / Detalle del Pago</label>
                        <input
                          type="text"
                          required
                          placeholder="Ej. Compra de gas, carne y desechables para venta dominical..."
                          value={egrConcepto}
                          onChange={(e) => setEgrConcepto(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Persona que Recibe / Autoriza</label>
                          <input
                            type="text"
                            required
                            placeholder="Ej. Hno. Carlos Ruiz"
                            value={egrResponsable}
                            onChange={(e) => setEgrResponsable(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Valor de Salida (COP $)</label>
                          <input
                            type="number"
                            min="100"
                            step="100"
                            required
                            placeholder="Ej. 85000"
                            value={egrMonto}
                            onChange={(e) => setEgrMonto(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-extrabold text-rose-700 bg-white"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Número de Factura o Soporte (Opcional)</label>
                        <input
                          type="text"
                          placeholder="Ej. Recibo #098 de Supermercado"
                          value={egrNota}
                          onChange={(e) => setEgrNota(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full py-3.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
                      >
                        <TrendingDown className="w-4 h-4" />
                        Registrar Salida en el Libro Único
                      </button>
                    </form>
                  </div>
                )}

                {/* LIBRO ÚNICO COMPLETO */}
                {tesoreroTab === 'LIBRO' && (
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50/50">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">Libro Único de Tesorería</h3>
                        <p className="text-xs text-slate-500">Registro histórico unificado de ingresos, arqueos, descuadres y salidas.</p>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
                        <div className="relative flex-1 sm:w-64">
                          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                          <input
                            type="text"
                            placeholder="Buscar actividad o persona..."
                            value={busquedaLibro}
                            onChange={(e) => setBusquedaLibro(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs bg-white outline-none focus:ring-2 focus:ring-indigo-600"
                          />
                        </div>
                        <select
                          value={filtroLibro}
                          onChange={(e) => setFiltroLibro(e.target.value)}
                          className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white"
                        >
                          <option value="TODOS">Todos los movimientos</option>
                          <option value="VERIFICADO">Verificados</option>
                          <option value="PENDIENTE">Pendientes</option>
                          <option value="DESCUADRE">Descuadres</option>
                          <option value="INGRESOS">Solo Ingresos</option>
                          <option value="EGRESOS">Solo Egresos</option>
                        </select>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-100 text-slate-600 text-[11px] uppercase border-b border-slate-200">
                            <th className="py-3.5 px-4 font-bold">Fecha / ID</th>
                            <th className="py-3.5 px-4 font-bold">Actividad / Concepto</th>
                            <th className="py-3.5 px-4 font-bold">Responsable</th>
                            <th className="py-3.5 px-4 font-bold text-right">Reportado</th>
                            <th className="py-3.5 px-4 font-bold text-right text-emerald-800">Entrada Real</th>
                            <th className="py-3.5 px-4 font-bold text-right text-rose-800">Salida</th>
                            <th className="py-3.5 px-4 font-bold">Estado</th>
                            <th className="py-3.5 px-4 font-bold text-center">Acción</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 text-sm">
                          {movimientosFiltrados.length === 0 ? (
                            <tr>
                              <td colSpan="8" className="text-center py-12 text-slate-500 text-xs font-medium">
                                No se encontraron registros en el libro.
                              </td>
                            </tr>
                          ) : (
                            movimientosFiltrados.map((m) => {
                              const inv = calcularResumenInventario(m);
                              return (
                                <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                                  <td className="py-3.5 px-4 text-xs font-semibold">
                                    <span className="block text-slate-900">{m.fecha}</span>
                                    <span className="font-mono text-[10px] text-slate-400 font-bold">{m.id}</span>
                                  </td>
                                  <td className="py-3.5 px-4 text-xs">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="font-bold text-slate-900 text-sm">{m.actividad}</span>
                                      {inv.esUnidades && (
                                        <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-900 font-bold text-[10px]">
                                          {inv.unidadesPagadas}/{inv.producidas} unid. pagadas
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-slate-600 block mt-0.5">{m.descripcion}</span>
                                    {m.notaTesorero && (
                                      <span className="block text-[11px] text-indigo-800 font-medium mt-1 bg-indigo-50/50 p-1.5 rounded border border-indigo-100">
                                        Nota: {m.notaTesorero}
                                      </span>
                                    )}

                                    {inv.esUnidades && m.compradores && m.compradores.length > 0 && (
                                      <div className="mt-2 pt-2 border-t border-slate-100">
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                          {m.compradores.map((c) => {
                                            const totalC = c.cantidad * inv.precioUnitario;
                                            const abonoC = c.estadoPago === 'PAGADO' ? totalC : Math.min(totalC, Math.max(0, Number(c.montoAbonado) || 0));
                                            const saldoC = Math.max(0, totalC - abonoC);
                                            return (
                                              <div key={c.id} className="bg-slate-50 border border-slate-200 p-2 rounded-lg text-[11px]">
                                                <div className="flex justify-between font-bold text-slate-800">
                                                  <span>{c.nombre}</span>
                                                  <span className={saldoC === 0 ? 'text-emerald-700' : 'text-rose-700'}>
                                                    {saldoC === 0 ? 'PAGADO ✓' : `Debe ${formatCOP(saldoC)}`}
                                                  </span>
                                                </div>
                                                <span className="text-slate-500">{c.cantidad} unid. ({formatCOP(totalC)})</span>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    )}
                                  </td>
                                  <td className="py-3.5 px-4 text-xs text-slate-700 font-medium">{m.responsable}</td>
                                  <td className="py-3.5 px-4 text-right text-xs font-semibold text-slate-900">
                                    {m.tipo === 'INGRESO' ? formatCOP(m.montoReportado) : '—'}
                                  </td>
                                  <td className="py-3.5 px-4 text-right text-xs font-extrabold text-emerald-700">
                                    {m.montoRecibido > 0 ? formatCOP(m.montoRecibido) : '—'}
                                  </td>
                                  <td className="py-3.5 px-4 text-right text-xs font-extrabold text-rose-600">
                                    {m.montoSalida > 0 ? formatCOP(m.montoSalida) : '—'}
                                  </td>
                                  <td className="py-3.5 px-4">{renderEstadoBadge(m)}</td>
                                  <td className="py-3.5 px-4 text-center">
                                    {m.tipo === 'INGRESO' && m.estado !== 'VERIFICADO' && (
                                      <button
                                        onClick={() => openArqueoModal(m)}
                                        className="px-3 py-1.5 bg-indigo-950 hover:bg-indigo-900 text-white text-xs font-bold rounded-xl shadow-xs transition-all"
                                      >
                                        Arqueo
                                      </button>
                                    )}
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
      </main>

      {/* ================= MODALES SECUNDARIOS ================= */}
      {showCambiarPinRecaudador && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-xl">
            <h3 className="font-bold text-base text-slate-900">Cambiar PIN de Recaudador</h3>
            <form onSubmit={handleGuardarNuevoPinRec}>
              <input
                type="password"
                required
                placeholder="Nuevo PIN..."
                value={nuevoPinRecInput}
                onChange={(e) => setNuevoPinRecInput(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm mb-4 outline-none focus:ring-2 focus:ring-indigo-600"
                autoFocus
              />
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowCambiarPinRecaudador(false)} className="flex-1 py-2 border rounded-xl text-xs font-semibold">Cancelar</button>
                <button type="submit" className="flex-1 py-2 bg-indigo-950 text-white rounded-xl text-xs font-bold shadow-xs">Guardar PIN</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCambiarPinTesorero && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-xl">
            <h3 className="font-bold text-base text-slate-900">Cambiar PIN de Tesorería</h3>
            <form onSubmit={handleGuardarNuevoPinTes}>
              <input
                type="password"
                required
                placeholder="Nuevo PIN..."
                value={nuevoPinTesInput}
                onChange={(e) => setNuevoPinTesInput(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm mb-4 outline-none focus:ring-2 focus:ring-indigo-600"
                autoFocus
              />
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowCambiarPinTesorero(false)} className="flex-1 py-2 border rounded-xl text-xs font-semibold">Cancelar</button>
                <button type="submit" className="flex-1 py-2 bg-indigo-950 text-white rounded-xl text-xs font-bold shadow-xs">Guardar PIN</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showBorrarTodoModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="font-bold text-base text-rose-700">¿Borrar todo el contenido?</h3>
            <p className="text-xs text-slate-600">Se eliminarán todos los registros de la base de datos en Supabase.</p>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setShowBorrarTodoModal(false)} className="flex-1 py-2.5 border rounded-xl text-xs font-semibold">Cancelar</button>
              <button onClick={handleBorrarTodo} className="flex-1 py-2.5 bg-rose-600 text-white rounded-xl text-xs font-bold shadow-xs">Sí, borrar todo</button>
            </div>
          </div>
        </div>
      )}

      {solicitudEdicionModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="font-bold text-base text-slate-900">Solicitar Permiso de Edición</h3>
            <p className="text-xs text-slate-500">Explica brevemente a Tesorería por qué necesitas corregir este registro:</p>
            <form onSubmit={handleEnviarSolicitudEdicion}>
              <textarea
                rows={3}
                required
                placeholder="Motivo..."
                value={motivoSolicitudEdicion}
                onChange={(e) => setMotivoSolicitudEdicion(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 text-xs rounded-xl mb-4 outline-none focus:ring-2 focus:ring-indigo-600"
                autoFocus
              />
              <div className="flex gap-2">
                <button type="button" onClick={() => setSolicitudEdicionModal(null)} className="flex-1 py-2 border rounded-xl text-xs font-semibold">Cancelar</button>
                <button type="submit" className="flex-1 py-2 bg-indigo-950 text-white rounded-xl text-xs font-bold shadow-xs">Enviar Solicitud</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {abonoModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="font-bold text-base text-slate-900">Registrar Abono de Deuda</h3>
            <p className="text-xs text-slate-600">
              Debe pendiente: <span className="text-rose-700 font-bold">{formatCOP(abonoModal.saldoPendiente)}</span>
            </p>
            <form onSubmit={handleConfirmarAbono}>
              <input
                type="number"
                min="100"
                max={abonoModal.saldoPendiente}
                step="100"
                required
                value={valorAbonoInput}
                onChange={(e) => setValorAbonoInput(e.target.value)}
                className="w-full px-4 py-3 border-2 border-indigo-200 text-lg font-extrabold rounded-xl mb-4 outline-none focus:ring-2 focus:ring-indigo-600 text-center bg-white"
                autoFocus
              />
              <div className="flex gap-2">
                <button type="button" onClick={() => setAbonoModal(null)} className="flex-1 py-2.5 border rounded-xl text-xs font-semibold">Cancelar</button>
                <button type="submit" className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs">Guardar Abono</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {arqueoItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl">
            <h3 className="font-bold text-base text-slate-900">Arqueo y Recepción de Recaudo</h3>
            <p className="text-xs text-slate-600">
              Registro: <strong>{arqueoItem.id}</strong> • {arqueoItem.fecha}<br />
              <strong>{arqueoItem.actividad} — {arqueoItem.responsable}</strong><br />
              <span className="text-slate-500">{arqueoItem.descripcion}</span>
            </p>

            {calcularResumenInventario(arqueoItem).esUnidades && (
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-emerald-50 border border-emerald-200 p-2 rounded-xl">
                  <span className="text-[10px] font-bold text-emerald-800 block">Pagadas</span>
                  <span className="font-bold text-emerald-950">{calcularResumenInventario(arqueoItem).unidadesPagadas} unid. ({formatCOP(calcularResumenInventario(arqueoItem).plataPagada)})</span>
                </div>
                <div className="bg-rose-50 border border-rose-200 p-2 rounded-xl">
                  <span className="text-[10px] font-bold text-rose-800 block">Fiadas</span>
                  <span className="font-bold text-rose-950">{calcularResumenInventario(arqueoItem).unidadesFiadas} unid. ({formatCOP(calcularResumenInventario(arqueoItem).plataFiada)})</span>
                </div>
                <div className="bg-amber-50 border border-amber-200 p-2 rounded-xl">
                  <span className="text-[10px] font-bold text-amber-800 block">Sin vender</span>
                  <span className="font-bold text-amber-950">{calcularResumenInventario(arqueoItem).unidadesSinVender} unid. ({formatCOP(calcularResumenInventario(arqueoItem).plataSinVender)})</span>
                </div>
              </div>
            )}

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs flex justify-between items-center">
              <span className="font-bold text-slate-700">Monto Reportado en Mano por Recaudador:</span>
              <span className="font-extrabold text-slate-900 text-base">{formatCOP(arqueoItem.montoReportado)}</span>
            </div>

            <form onSubmit={handleConfirmarArqueo} className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Monto Físico Contado por el Tesorero ($)</label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  required
                  value={montoFisicoContado}
                  onChange={(e) => setMontoFisicoContado(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-indigo-200 text-lg font-extrabold rounded-xl outline-none focus:ring-2 focus:ring-indigo-600 text-center bg-white"
                  autoFocus
                />
              </div>

              {Number(montoFisicoContado || 0) === Number(arqueoItem.montoReportado) ? (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-2 rounded-xl text-xs font-bold text-center">
                  ✅ ¡Cuadre exacto! El dinero coincide 100% con lo reportado.
                </div>
              ) : (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 px-3 py-2 rounded-xl text-xs font-bold text-center">
                  ⚠️ Descuadre de {formatCOP(Math.abs(Number(arqueoItem.montoReportado) - Number(montoFisicoContado || 0)))}. Se generará una novedad en revisión.
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Observación / Nota de Tesorería</label>
                <textarea
                  rows={2}
                  placeholder="Ej. Conteo exacto en sobre sellado..."
                  value={notaArqueo}
                  onChange={(e) => setNotaArqueo(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 text-xs rounded-xl outline-none focus:ring-2 focus:ring-indigo-600 bg-white"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setArqueoItem(null)} className="flex-1 py-2.5 border rounded-xl text-xs font-semibold hover:bg-slate-50">Cancelar</button>
                <button type="submit" className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs">Confirmar y Recibir</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}