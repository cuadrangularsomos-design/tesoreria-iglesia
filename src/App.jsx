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
  Filter,
  Receipt,
  Calculator,
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

const INITIAL_DATA = [];

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
  const [movimientos, setMovimientos] = useState(INITIAL_DATA);
  const [pinRecaudador, setPinRecaudador] = useState('2026');
  const [pinTesorero, setPinTesorero] = useState('1234');
  const [cargandoNube, setCargandoNube] = useState(true);

  // Cargar datos y PINs desde Supabase al iniciar + Escuchar cambios en TIEMPO REAL
  useEffect(() => {
    const fetchData = () => {
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
    };

    fetchData();

    // Suscripción en tiempo real a Supabase (Realtime)
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

  const [expandedRows, setExpandedRows] = useState({});

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

  // Guardado automático en Supabase de movimientos y PINs
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
    const nuevoPin = nuevoPinRecInput.trim();
    setPinRecaudador(nuevoPin);
    setShowCambiarPinRecaudador(false);
    setNuevoPinRecInput('');
    guardarEnNube(movimientos, nuevoPin, pinTesorero);
    showToast('Contraseña de Recaudador actualizada y sincronizada.', 'success');
  };

  const handleGuardarNuevoPinTes = (e) => {
    e.preventDefault();
    if (!nuevoPinTesInput.trim()) {
      showToast('Ingresa una contraseña válida.', 'error');
      return;
    }
    const nuevoPin = nuevoPinTesInput.trim();
    setPinTesorero(nuevoPin);
    setShowCambiarPinTesorero(false);
    setNuevoPinTesInput('');
    guardarEnNube(movimientos, pinRecaudador, nuevoPin);
    showToast('Contraseña de Tesorería actualizada y sincronizada.', 'success');
  };

  const handleBorrarTodoContenido = () => {
    setMovimientos([]);
    setShowBorrarTodoModal(false);
    guardarEnNube([], pinRecaudador, pinTesorero);
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
                compradores: Array.isArray(recCompradores) ? [...recCompradores] : [],
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
        showToast('Recaudo modificado y actualizado en la nube.', 'success');
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

      const actualizados = [nuevoRegistro, ...movimientos];
      setMovimientos(actualizados);
      guardarEnNube(actualizados, pinRecaudador, pinTesorero);
      setExpandedRows((prev) => ({ ...prev, [nuevoId]: true }));
      setRecDescripcion('');
      setRecCompradores([]);
      showToast('Actividad registrada y sincronizada en tiempo real.', 'success');
      return;
    }

    const valor = Number(recMonto.toString().replace(/\D/g, ''));
    if (!recDescripcion.trim() || valor <= 0) {
      showToast('Por favor completa la descripción y un monto válido.', 'error');
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
              cantidadProducida: undefined,
              precioUnitario: undefined,
              compradores: undefined,
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
      showToast('Recaudo general modificado y sincronizado.', 'success');
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

    const actualizados = [nuevoRegistro, ...movimientos];
    setMovimientos(actualizados);
    guardarEnNube(actualizados, pinRecaudador, pinTesorero);
    setRecDescripcion('');
    setRecMonto('');
    showToast('Recaudo registrado y enviado a Tesorería.', 'success');
  };

  const handleIniciarEdicionRecaudo = (item) => {
    if (item.estado === 'VERIFICADO') {
      showToast('Este recaudo ya fue recibido por Tesorería; no se puede editar.', 'warning');
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
    showToast('Editando registro. Realiza los cambios y guarda.', 'success');
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
      showToast('Escribe brevemente qué dato necesitas corregir.', 'error');
      return;
    }

    const actualizados = movimientos.map((m) =>
      m.id === solicitudEdicionModal.id
        ? {
            ...m,
            solicitudEdicion: true,
            motivoEdicion: motivo,
          }
        : m
    );

    setMovimientos(actualizados);
    guardarEnNube(actualizados, pinRecaudador, pinTesorero);
    showToast(`Solicitud enviada a Tesorería para el registro ${solicitudEdicionModal.id}.`, 'success');
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
              ? `${m.notaTesorero ? m.notaTesorero + ' | ' : ''}[Edición autorizada por Tesorería]`
              : `${m.notaTesorero ? m.notaTesorero + ' | ' : ''}[Solicitud rechazada por Tesorería]`,
          }
        : m
    );
    setMovimientos(actualizados);
    guardarEnNube(actualizados, pinRecaudador, pinTesorero);
    showToast(
      aprobar ? `Edición autorizada para ${item.id}.` : `Solicitud rechazada para ${item.id}.`,
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
      showToast('Escribe el nombre de la persona.', 'error');
      return;
    }
    if (cant <= 0) {
      showToast('La cantidad debe ser mayor a 0.', 'error');
      return;
    }
    if (producidas > 0 && resumenFormUnidades.unidadesAsignadas + cant > producidas) {
      showToast(`No puedes asignar ${cant} unidades. Quedan ${resumenFormUnidades.unidadesSinVender} disponibles.`, 'error');
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
      showToast(`El abono supera el saldo pendiente de ${formatCOP(abonoModal.saldoPendiente)}.`, 'error');
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
    guardarEnNube(actualizados, pinRecaudador, pinTesorero);
    showToast(`Abono de ${formatCOP(abonoNuevo)} registrado y sincronizado.`, 'success');
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
    guardarEnNube(actualizados, pinRecaudador, pinTesorero);
    showToast('Estado de pago actualizado en tiempo real.', 'success');
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
              : `Diferencia detectada de ${formatCOP(reportado - contado)}.`),
        };
      }
      return m;
    });

    setMovimientos(actualizados);
    guardarEnNube(actualizados, pinRecaudador, pinTesorero);
    setArqueoItem(null);

    if (esExacto) {
      showToast('Dinero recibido, verificado y sincronizado.', 'success');
    } else {
      showToast('Arqueo guardado con DESCUADRE.', 'warning');
    }
  };

  const handleResolverDescuadre = (item) => {
    const actualizados = movimientos.map((m) => {
      if (m.id === item.id) {
        return {
          ...m,
          montoReportado: m.montoRecibido,
          estado: 'VERIFICADO',
          notaTesorero: `${m.notaTesorero} | [Descuadre aclarado y cerrado]`,
        };
      }
      return m;
    });
    setMovimientos(actualizados);
    guardarEnNube(actualizados, pinRecaudador, pinTesorero);
    showToast('Descuadre aclarado y marcado como Verificado.', 'success');
  };

  const handleRegistrarEgreso = (e) => {
    e.preventDefault();
    const valor = Number(egrMonto.toString().replace(/\D/g, ''));
    if (!egrConcepto.trim() || !egrResponsable.trim() || valor <= 0) {
      showToast('Completa todos los campos del gasto.', 'error');
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
    showToast(`Salida por ${formatCOP(valor)} registrada y sincronizada.`, 'success');
    setTesoreroTab('LIBRO');
  };

  const handleExportCSV = () => {
    const headers = [
      'ID', 'Fecha', 'Tipo', 'Modo', 'Actividad', 'Descripción', 'Responsable',
      'Método', 'Producidas', 'Precio Unit.', 'Pagadas', 'Fiadas', 'Sin Vender',
      'Faltante Calle', 'Compradores', 'Reportado Mano', 'Recibido Caja', 'Salida', 'Estado', 'Nota'
    ];

    const rows = movimientos.map((m) => {
      const inv = calcularResumenInventario(m);
      const precio = Number(m.precioUnitario) || 0;
      const detallePersonas =
        m.modoRegistro === 'UNIDADES' && Array.isArray(m.compradores)
          ? m.compradores
              .map((c) => {
                const totalC = (Number(c.cantidad) || 0) * precio;
                const abonoC = c.estadoPago === 'PAGADO' ? totalC : Math.min(totalC, Number(c.montoAbonado) || 0);
                const saldoC = Math.max(0, totalC - abonoC);
                return saldoC > 0 ? `${c.nombre} (${c.cantidad} unid - Debe ${formatCOP(saldoC)})` : `${c.nombre} (PAGADO)`;
              })
              .join(' | ')
          : '';

      return [
        m.id, m.fecha, m.tipo, m.modoRegistro || 'GENERAL', `"${m.actividad}"`, `"${m.descripcion}"`,
        `"${m.responsable}"`, m.metodoPago, inv.esUnidades ? inv.producidas : '',
        inv.esUnidades ? inv.precioUnitario : '', inv.esUnidades ? inv.unidadesPagadas : '',
        inv.esUnidades ? inv.unidadesFiadas : '', inv.esUnidades ? inv.unidadesSinVender : '',
        inv.esUnidades ? inv.totalPlataFaltante : 0, `"${detallePersonas}"`,
        m.montoReportado, m.montoRecibido, m.montoSalida, m.estado, `"${m.notaTesorero || ''}"`
      ];
    });

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((e) => e.join(';'))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Libro_Tesoreria_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Libro exportado a CSV.', 'success');
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
            Verificado
          </span>
        );
      case 'PENDIENTE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            Pendiente
          </span>
        );
      case 'DESCUADRE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            Descuadre
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
                  Sincronizado en tiempo real por Supabase
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
                <span>Tesorería</span>
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
                <h2 className="text-xl font-bold text-slate-900">Acceso Recaudadores</h2>
                <p className="text-sm text-slate-500 mt-1">Ingresa tu PIN de recaudador.</p>

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
                    Ingresar
                  </button>
                </form>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-sm font-bold text-slate-800">Recaudador Activo</span>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setShowCambiarPinRecaudador(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-900 text-xs font-bold transition-all"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      Cambiar Contraseña
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsRecaudadorAuth(false)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition-all"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      Bloquear
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
                              {editingRecaudoId ? 'Modificar Recaudo' : 'Registrar Recaudo'}
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
                            Por Unidades
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
                            <label className="block text-xs font-bold uppercase text-slate-600 mb-1.5">
                              Fecha
                            </label>
                            <input
                              type="date"
                              required
                              value={recFecha}
                              onChange={(e) => setRecFecha(e.target.value)}
                              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold uppercase text-slate-600 mb-1.5">
                              Actividad
                            </label>
                            <select
                              value={recActividad}
                              onChange={(e) => setRecActividad(e.target.value)}
                              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white"
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
                          <label className="block text-xs font-bold uppercase text-slate-600 mb-1.5">
                            Nombre del Recaudador
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="Ej. Hna. Marta"
                            value={recNombre}
                            onChange={(e) => setRecNombre(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
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
                                  value={recCantidadProducida}
                                  onChange={(e) => setRecCantidadProducida(e.target.value)}
                                  className="w-full px-3 py-2 rounded-lg border border-indigo-200 bg-white text-sm font-extrabold text-slate-900"
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
                                  value={recPrecioUnitario}
                                  onChange={(e) => setRecPrecioUnitario(e.target.value)}
                                  className="w-full px-3 py-2 rounded-lg border border-indigo-200 bg-white text-sm font-extrabold text-slate-900"
                                />
                              </div>
                              <div className="col-span-2 flex items-center justify-between pt-2 border-t border-indigo-200 text-xs">
                                <span className="font-semibold text-indigo-900">Total Esperado:</span>
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
                                  Quedan {resumenFormUnidades.unidadesSinVender} libres
                                </span>
                              </div>

                              <div className="grid grid-cols-12 gap-2">
                                <input
                                  type="text"
                                  placeholder="Nombre..."
                                  value={nuevoCompNombre}
                                  onChange={(e) => setNuevoCompNombre(e.target.value)}
                                  className="col-span-5 px-2.5 py-2 rounded-lg border border-slate-300 bg-white text-xs"
                                />
                                <input
                                  type="number"
                                  min="1"
                                  placeholder="Cant."
                                  value={nuevoCompCantidad}
                                  onChange={(e) => setNuevoCompCantidad(e.target.value)}
                                  className="col-span-2 px-2 py-2 rounded-lg border border-slate-300 bg-white text-xs font-bold text-center"
                                />
                                <select
                                  value={nuevoCompEstado}
                                  onChange={(e) => setNuevoCompEstado(e.target.value)}
                                  className="col-span-3 px-1.5 py-2 rounded-lg border border-slate-300 bg-white text-xs font-semibold"
                                >
                                  <option value="PAGADO">Pagado</option>
                                  <option value="FIADO">Fiado</option>
                                </select>
                                <button
                                  type="button"
                                  onClick={handleAgregarCompradorForm}
                                  className="col-span-2 bg-indigo-900 hover:bg-indigo-800 text-white rounded-lg flex items-center justify-center"
                                >
                                  <UserPlus className="w-4 h-4" />
                                </button>
                              </div>

                              {nuevoCompEstado === 'FIADO' && (
                                <div className="flex items-center justify-between gap-2 bg-amber-50 p-2 rounded-lg border border-amber-200">
                                  <label className="text-[11px] font-bold text-amber-900">Abono ($):</label>
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
                                    const abonoC = c.estadoPago === 'PAGADO' ? totalC : Math.min(totalC, Number(c.montoAbonado) || 0);
                                    const saldoC = Math.max(0, totalC - abonoC);

                                    return (
                                      <div key={c.id} className="px-2.5 py-2 flex items-center justify-between gap-2 text-xs">
                                        <div>
                                          <span className="font-bold text-slate-800">{c.nombre}</span>
                                          <span className="text-slate-500 ml-1">({c.cantidad} unid)</span>
                                          {saldoC > 0 && (
                                            <span className="block text-[10px] text-rose-700 font-semibold">
                                              Debe: {formatCOP(saldoC)}
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
                          </div>
                        ) : (
                          <div>
                            <label className="block text-xs font-bold uppercase text-slate-600 mb-1.5">
                              Valor Total ($)
                            </label>
                            <input
                              type="number"
                              min="100"
                              step="100"
                              required
                              value={recMonto}
                              onChange={(e) => setRecMonto(e.target.value)}
                              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold text-slate-900"
                            />
                          </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold uppercase text-slate-600 mb-1.5">
                              Detalle
                            </label>
                            <input
                              type="text"
                              placeholder="Opcional..."
                              value={recDescripcion}
                              onChange={(e) => setRecDescripcion(e.target.value)}
                              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold uppercase text-slate-600 mb-1.5">
                              Método
                            </label>
                            <select
                              value={recMetodo}
                              onChange={(e) => setRecMetodo(e.target.value)}
                              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white"
                            >
                              <option value="Efectivo">Efectivo</option>
                              <option value="Transferencia / Nequi">Transferencia / Nequi</option>
                            </select>
                          </div>
                        </div>

                        <button
                          type="submit"
                          className={`w-full py-3 rounded-xl text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 ${
                            editingRecaudoId ? 'bg-amber-600 hover:bg-amber-700' : 'bg-emerald-600 hover:bg-emerald-700'
                          }`}
                        >
                          {editingRecaudoId ? 'Guardar Cambios' : 'Enviar Recaudo'}
                        </button>
                      </form>
                    </div>
                  </div>

                  <div className="lg:col-span-7 space-y-4">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold text-slate-900">Historial de Recaudos</h2>
                        <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-900 text-xs font-bold">
                          {movimientos.filter((m) => m.tipo === 'INGRESO').length} registros
                        </span>
                      </div>

                      <div className="space-y-4">
                        {movimientos.filter((m) => m.tipo === 'INGRESO').length === 0 ? (
                          <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                            <p className="text-sm font-semibold text-slate-600">No hay registros aún.</p>
                          </div>
                        ) : (
                          movimientos
                            .filter((m) => m.tipo === 'INGRESO')
                            .map((item) => {
                              const inv = calcularResumenInventario(item);
                              const isExpanded = !!expandedRows[item.id];

                              return (
                                <div key={item.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60">
                                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                                    <div>
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-xs font-mono font-bold text-indigo-800 bg-indigo-100 px-2 py-0.5 rounded">
                                          {item.id}
                                        </span>
                                        <span className="font-bold text-slate-900 text-sm">{item.actividad}</span>
                                        <span className="text-xs text-slate-400">• {item.fecha}</span>
                                      </div>
                                      <p className="text-xs text-slate-600 mt-1">{item.descripcion}</p>
                                      <p className="text-xs font-semibold text-slate-700 mt-1">
                                        Resp: {item.responsable} ({item.metodoPago})
                                      </p>
                                    </div>

                                    <div className="flex sm:flex-col items-end justify-between gap-2">
                                      <span className="text-lg font-extrabold text-slate-900">
                                        {formatCOP(item.montoReportado)}
                                      </span>
                                      <div className="flex items-center gap-2 flex-wrap justify-end">
                                        {item.estado !== 'VERIFICADO' && (
                                          <>
                                            {item.edicionAutorizada ? (
                                              <button
                                                type="button"
                                                onClick={() => handleIniciarEdicionRecaudo(item)}
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
                                                className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300"
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

                                  {inv.esUnidades && (
                                    <div className="mt-3 pt-3 border-t border-slate-200 space-y-2.5">
                                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                                        <div className="bg-white px-2 py-1.5 rounded-lg border border-slate-200">
                                          <span className="text-slate-400 block">Producidas</span>
                                          <span className="font-bold text-slate-800">{inv.producidas}</span>
                                        </div>
                                        <div className="bg-emerald-50 px-2 py-1.5 rounded-lg border border-emerald-200">
                                          <span className="text-emerald-700 block">Pagadas</span>
                                          <span className="font-extrabold text-emerald-900">{formatCOP(inv.plataPagada)}</span>
                                        </div>
                                        <div className="bg-rose-50 px-2 py-1.5 rounded-lg border border-rose-200">
                                          <span className="text-rose-700 block">Fiados</span>
                                          <span className="font-extrabold text-rose-900">{formatCOP(inv.plataFiada)}</span>
                                        </div>
                                        <div className="bg-amber-50 px-2 py-1.5 rounded-lg border border-amber-200">
                                          <span className="text-amber-700 block">Sin vender</span>
                                          <span className="font-extrabold text-amber-900">{formatCOP(inv.plataSinVender)}</span>
                                        </div>
                                      </div>

                                      {item.compradores && item.compradores.length > 0 && (
                                        <div>
                                          <button
                                            type="button"
                                            onClick={() => toggleExpandRow(item.id)}
                                            className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-800"
                                          >
                                            <Users className="w-3.5 h-3.5" />
                                            {isExpanded ? 'Ocultar compradores' : `Ver compradores (${item.compradores.length})`}
                                          </button>

                                          {isExpanded && (
                                            <div className="mt-2 bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
                                              {item.compradores.map((c) => {
                                                const totalComp = c.cantidad * inv.precioUnitario;
                                                const abonoActual = c.estadoPago === 'PAGADO' ? totalComp : Math.min(totalComp, Number(c.montoAbonado) || 0);
                                                const saldoPendiente = Math.max(0, totalComp - abonoActual);

                                                return (
                                                  <div key={c.id} className="px-3 py-2 flex items-center justify-between gap-2 text-xs">
                                                    <div>
                                                      <span className="font-bold text-slate-800">{c.nombre}</span>
                                                      <span className="text-slate-500 ml-1">• {c.cantidad} unid.</span>
                                                      {saldoPendiente > 0 && (
                                                        <span className="block text-[10px] text-rose-700 font-bold">
                                                          Debe: {formatCOP(saldoPendiente)}
                                                        </span>
                                                      )}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                      {saldoPendiente > 0 && (
                                                        <button
                                                          type="button"
                                                          onClick={() => openAbonoModal(item, c)}
                                                          className="px-2 py-1 rounded bg-indigo-900 text-white text-[10px] font-bold"
                                                        >
                                                          Abonar
                                                        </button>
                                                      )}
                                                      <button
                                                        type="button"
                                                        onClick={() => handleTogglePagoCompradorExistente(item.id, c.id)}
                                                        className={`px-2 py-1 rounded text-[10px] font-bold ${
                                                          saldoPendiente === 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                                                        }`}
                                                      >
                                                        {saldoPendiente === 0 ? 'Pagado' : 'Saldar'}
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

        {activeRole === 'TESORERO' && (
          <>
            {!isTesoreroAuth ? (
              <div className="max-w-md mx-auto mt-10 bg-white rounded-2xl shadow-lg border border-slate-200 p-8 text-center">
                <div className="w-14 h-14 bg-indigo-100 text-indigo-900 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Acceso Tesorería</h2>
                <p className="text-sm text-slate-500 mt-1">Ingresa el PIN de tesorería.</p>

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
                    Ingresar
                  </button>
                </form>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-sm font-bold text-slate-800">Tesorero Activo</span>
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
                      Bloquear
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Entradas</span>
                    <p className="text-lg font-extrabold text-slate-900 mt-2">{formatCOP(kpis.totalEntradasVerificadas)}</p>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Salidas</span>
                    <p className="text-lg font-extrabold text-rose-600 mt-2">- {formatCOP(kpis.totalSalidas)}</p>
                  </div>
                  <div className="bg-indigo-950 p-4 rounded-2xl shadow-md text-white">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-200">Saldo Caja</span>
                    <p className="text-xl font-extrabold text-emerald-400 mt-2">{formatCOP(kpis.saldoRealEnCaja)}</p>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-sm">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">Pendiente</span>
                    <p className="text-lg font-extrabold text-amber-700 mt-2">{formatCOP(kpis.pendientePorRecoger)}</p>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-indigo-200 shadow-sm">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-900">En Calle</span>
                    <p className="text-lg font-extrabold text-indigo-900 mt-2">{formatCOP(kpis.totalCarteraYSinVender)}</p>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-rose-200 shadow-sm">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-rose-800">Descuadre</span>
                    <p className="text-lg font-extrabold text-rose-700 mt-2">{formatCOP(kpis.descuadreAcumulado)}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
                  <button
                    onClick={() => setTesoreroTab('BANDEJA')}
                    className={`px-4 py-2.5 rounded-xl text-sm font-bold ${
                      tesoreroTab === 'BANDEJA' ? 'bg-indigo-900 text-white' : 'bg-white text-slate-600 border'
                    }`}
                  >
                    Recepción y Permisos ({kpis.cantidadPendientes + kpis.cantidadDescuadres + kpis.cantidadSolicitudesEdicion})
                  </button>
                  <button
                    onClick={() => setTesoreroTab('EGRESOS')}
                    className={`px-4 py-2.5 rounded-xl text-sm font-bold ${
                      tesoreroTab === 'EGRESOS' ? 'bg-indigo-900 text-white' : 'bg-white text-slate-600 border'
                    }`}
                  >
                    Registrar Gasto
                  </button>
                  <button
                    onClick={() => setTesoreroTab('LIBRO')}
                    className={`px-4 py-2.5 rounded-xl text-sm font-bold ${
                      tesoreroTab === 'LIBRO' ? 'bg-indigo-900 text-white' : 'bg-white text-slate-600 border'
                    }`}
                  >
                    Libro Único ({movimientos.length})
                  </button>
                </div>

                {tesoreroTab === 'BANDEJA' && (
                  <div className="space-y-6">
                    {kpis.cantidadSolicitudesEdicion > 0 && (
                      <div className="bg-indigo-50 rounded-2xl border-2 border-indigo-200 p-5">
                        <h3 className="font-bold text-indigo-950 text-sm mb-3">Solicitudes de Edición</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {movimientos
                            .filter((m) => m.solicitudEdicion)
                            .map((item) => (
                              <div key={item.id} className="bg-white p-4 rounded-xl border flex flex-col justify-between gap-3">
                                <div>
                                  <span className="text-xs font-mono font-bold bg-indigo-100 text-indigo-900 px-2 py-0.5 rounded">
                                    {item.id} — {item.actividad}
                                  </span>
                                  <p className="text-xs text-amber-900 bg-amber-50 p-2 rounded mt-2">
                                    "{item.motivoEdicion}"
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleAutorizarEdicionTesorero(item, true)}
                                    className="flex-1 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded"
                                  >
                                    Autorizar
                                  </button>
                                  <button
                                    onClick={() => handleAutorizarEdicionTesorero(item, false)}
                                    className="py-1.5 px-3 bg-rose-50 text-rose-700 text-xs font-bold rounded"
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
                      <div className="bg-white rounded-2xl border p-6">
                        <h3 className="font-bold text-slate-900 mb-4">Pendientes por Recoger</h3>
                        {movimientos.filter((m) => m.estado === 'PENDIENTE').length === 0 ? (
                          <p className="text-sm text-slate-500 py-6 text-center">Todo al día.</p>
                        ) : (
                          <div className="space-y-3">
                            {movimientos
                              .filter((m) => m.estado === 'PENDIENTE')
                              .map((item) => (
                                <div key={item.id} className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 flex justify-between items-center gap-3">
                                  <div>
                                    <span className="font-bold text-sm text-slate-900">{item.actividad}</span>
                                    <p className="text-xs text-slate-600">Resp: {item.responsable}</p>
                                  </div>
                                  <div className="text-right">
                                    <span className="font-extrabold text-sm block">{formatCOP(item.montoReportado)}</span>
                                    <button
                                      onClick={() => openArqueoModal(item)}
                                      className="mt-1 px-3 py-1 bg-indigo-900 text-white text-xs font-bold rounded"
                                    >
                                      Recibir
                                    </button>
                                  </div>
                                </div>
                              ))}
                          </div>
                        )}
                      </div>

                      <div className="bg-white rounded-2xl border p-6">
                        <h3 className="font-bold text-slate-900 mb-4">Descuadres en Revisión</h3>
                        {movimientos.filter((m) => m.estado === 'DESCUADRE').length === 0 ? (
                          <p className="text-sm text-slate-500 py-6 text-center">Sin descuadres.</p>
                        ) : (
                          <div className="space-y-3">
                            {movimientos
                              .filter((m) => m.estado === 'DESCUADRE')
                              .map((item) => (
                                <div key={item.id} className="p-4 rounded-xl border border-rose-200 bg-rose-50/40 space-y-2">
                                  <div className="flex justify-between">
                                    <span className="font-bold text-sm">{item.actividad}</span>
                                    <button
                                      onClick={() => handleResolverDescuadre(item)}
                                      className="px-2.5 py-1 bg-emerald-600 text-white text-xs font-bold rounded"
                                    >
                                      Cerrar Revisión
                                    </button>
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
                  <div className="max-w-2xl bg-white rounded-2xl border shadow-sm overflow-hidden">
                    <div className="bg-slate-900 px-6 py-4 text-white">
                      <h3 className="font-bold text-base">Registrar Gasto</h3>
                    </div>
                    <form onSubmit={handleRegistrarEgreso} className="p-6 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <input
                          type="date"
                          required
                          value={egrFecha}
                          onChange={(e) => setEgrFecha(e.target.value)}
                          className="px-3.5 py-2.5 rounded-xl border text-sm"
                        />
                        <select
                          value={egrCategoria}
                          onChange={(e) => setEgrCategoria(e.target.value)}
                          className="px-3.5 py-2.5 rounded-xl border text-sm bg-white"
                        >
                          {CATEGORIAS_EGRESO.map((cat) => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>
                      <input
                        type="text"
                        required
                        placeholder="Concepto del gasto..."
                        value={egrConcepto}
                        onChange={(e) => setEgrConcepto(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border text-sm"
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <input
                          type="text"
                          required
                          placeholder="Autoriza..."
                          value={egrResponsable}
                          onChange={(e) => setEgrResponsable(e.target.value)}
                          className="px-3.5 py-2.5 rounded-xl border text-sm"
                        />
                        <input
                          type="number"
                          min="100"
                          step="100"
                          required
                          placeholder="Valor ($)"
                          value={egrMonto}
                          onChange={(e) => setEgrMonto(e.target.value)}
                          className="px-3.5 py-2.5 rounded-xl border text-sm font-bold text-rose-700"
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm"
                      >
                        Registrar Salida
                      </button>
                    </form>
                  </div>
                )}

                {tesoreroTab === 'LIBRO' && (
                  <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
                    <div className="p-5 border-b flex justify-between gap-4 flex-wrap">
                      <h3 className="text-lg font-bold text-slate-900">Libro Único</h3>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Buscar..."
                          value={busquedaLibro}
                          onChange={(e) => setBusquedaLibro(e.target.value)}
                          className="px-3 py-2 rounded-xl border text-xs"
                        />
                        <select
                          value={filtroLibro}
                          onChange={(e) => setFiltroLibro(e.target.value)}
                          className="px-3 py-2 rounded-xl border text-xs font-semibold bg-white"
                        >
                          <option value="TODOS">Todos</option>
                          <option value="VERIFICADO">Verificados</option>
                          <option value="PENDIENTE">Pendientes</option>
                          <option value="DESCUADRE">Descuadres</option>
                        </select>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-100 text-slate-600 text-[11px] uppercase border-b">
                            <th className="py-3 px-4">Fecha / ID</th>
                            <th className="py-3 px-4">Actividad</th>
                            <th className="py-3 px-4">Responsable</th>
                            <th className="py-3 px-4 text-right">Reportado</th>
                            <th className="py-3 px-4 text-right">Entrada Real</th>
                            <th className="py-3 px-4 text-right">Salida</th>
                            <th className="py-3 px-4">Estado</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y text-sm">
                          {movimientosFiltrados.map((m) => (
                            <tr key={m.id} className="hover:bg-slate-50">
                              <td className="py-3 px-4 text-xs font-semibold">{m.fecha}<div className="text-[10px] text-slate-400">{m.id}</div></td>
                              <td className="py-3 px-4 text-xs font-bold">{m.actividad}<div className="text-slate-600 font-normal">{m.descripcion}</div></td>
                              <td className="py-3 px-4 text-xs">{m.responsable}</td>
                              <td className="py-3 px-4 text-right text-xs">{m.tipo === 'INGRESO' ? formatCOP(m.montoReportado) : '—'}</td>
                              <td className="py-3 px-4 text-right text-xs font-extrabold text-emerald-700">{m.montoRecibido > 0 ? formatCOP(m.montoRecibido) : '—'}</td>
                              <td className="py-3 px-4 text-right text-xs font-extrabold text-rose-600">{m.montoSalida > 0 ? formatCOP(m.montoSalida) : '—'}</td>
                              <td className="py-3 px-4">{renderEstadoBadge(m)}</td>
                            </tr>
                          ))}
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

      {/* Modales secundarios */}
      {showCambiarPinRecaudador && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4">
            <h3 className="font-bold text-base">Cambiar PIN Recaudador</h3>
            <form onSubmit={handleGuardارNuevoPinRec => {}}>
              <input
                type="password"
                required
                placeholder="Nuevo PIN..."
                value={nuevoPinRecInput}
                onChange={(e) => setNuevoPinRecInput(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border text-sm mb-4"
                autoFocus
              />
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowCambiarPinRecaudador(false)} className="flex-1 py-2 border rounded-xl text-xs font-semibold">Cancelar</button>
                <button type="submit" onClick={handleGuardarNuevoPinRec} className="flex-1 py-2 bg-indigo-900 text-white rounded-xl text-xs font-bold">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCambiarPinTesorero && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4">
            <h3 className="font-bold text-base">Cambiar PIN Tesorería</h3>
            <input
              type="password"
              required
              placeholder="Nuevo PIN..."
              value={nuevoPinTesInput}
              onChange={(e) => setNuevoPinTesInput(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border text-sm mb-4"
              autoFocus
            />
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowCambiarPinTesorero(false)} className="flex-1 py-2 border rounded-xl text-xs font-semibold">Cancelar</button>
              <button type="button" onClick={handleGuardarNuevoPinTes} className="flex-1 py-2 bg-indigo-900 text-white rounded-xl text-xs font-bold">Guardar</button>
            </div>
          </div>
        </div>
      )}

      {showBorrarTodoModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="font-bold text-base text-rose-700">Borrar Todo</h3>
            <p className="text-xs text-slate-600">Se eliminarán todos los registros de la base de datos.</p>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setShowBorrarTodoModal(false)} className="flex-1 py-2.5 border rounded-xl text-xs font-semibold">Cancelar</button>
              <button onClick={handleBorrarTodoContenido} className="flex-1 py-2.5 bg-rose-600 text-white rounded-xl text-xs font-bold">Sí, borrar</button>
            </div>
          </div>
        </div>
      )}

      {solicitudEdicionModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="font-bold text-base">Solicitar Permiso de Edición</h3>
            <form onSubmit={handleEnviarSolicitudEdicion}>
              <textarea
                rows={3}
                required
                placeholder="Motivo..."
                value={motivoSolicitudEdicion}
                onChange={(e) => setMotivoSolicitudEdicion(e.target.value)}
                className="w-full px-3 py-2 border text-xs rounded-xl mb-4"
                autoFocus
              />
              <div className="flex gap-2">
                <button type="button" onClick={() => setSolicitudEdicionModal(null)} className="flex-1 py-2 border rounded-xl text-xs font-semibold">Cancelar</button>
                <button type="submit" className="flex-1 py-2 bg-indigo-900 text-white rounded-xl text-xs font-bold">Enviar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {abonoModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="font-bold text-base">Registrar Abono</h3>
            <p className="text-xs text-slate-600">Debe: {formatCOP(abonoModal.saldoPendiente)}</p>
            <form onSubmit={handleConfirmarAbono}>
              <input
                type="number"
                min="100"
                max={abonoModal.saldoPendiente}
                step="100"
                required
                value={valorAbonoInput}
                onChange={(e) => setValorAbonoInput(e.target.value)}
                className="w-full px-4 py-3 border-2 border-indigo-200 text-lg font-extrabold rounded-xl mb-4"
                autoFocus
              />
              <div className="flex gap-2">
                <button type="button" onClick={() => setAbonoModal(null)} className="flex-1 py-2.5 border rounded-xl text-xs font-semibold">Cancelar</button>
                <button type="submit" className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {arqueoItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4">
            <h3 className="font-bold text-base">Arqueo y Recepción</h3>
            <p className="text-xs text-slate-600">Reportado: {formatCOP(arqueoItem.montoReportado)}</p>
            <form onSubmit={handleConfirmarArqueo}>
              <input
                type="number"
                min="0"
                step="100"
                required
                value={montoFisicoContado}
                onChange={(e) => setMontoFisicoContado(e.target.value)}
                className="w-full px-4 py-3 border-2 border-indigo-200 text-lg font-extrabold rounded-xl mb-3"
                autoFocus
              />
              <textarea
                rows={2}
                placeholder="Observación..."
                value={notaArqueo}
                onChange={(e) => setNotaArqueo(e.target.value)}
                className="w-full px-3 py-2 border text-xs rounded-xl mb-4"
              />
              <div className="flex gap-2">
                <button type="button" onClick={() => setArqueoItem(null)} className="flex-1 py-2.5 border rounded-xl text-xs font-semibold">Cancelar</button>
                <button type="submit" className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold">Confirmar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}