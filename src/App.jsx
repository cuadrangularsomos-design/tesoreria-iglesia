</div>
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
                        {movimientos.filter((m) => m.tipo === 'INGRESO').length === 0 ? (
                          <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                            <p className="text-sm font-semibold text-slate-600">No hay recaudos enviados por los recaudadores todavía.</p>
                          </div>
                        ) : (
                          movimientos
                            .filter((m) => m.tipo === 'INGRESO')
                            .map((item) => {
                              const inv = calcularResumenInventario(item);
                              const abonoOpendienteARecibir = Number(item.ultimoAbonoReportado) > 0 ? Number(item.ultimoAbonoReportado) : Number(item.montoReportado);

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
                                        {item.solicitudEdicion && !item.edicionAutorizada && (
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
                                          className="px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition-all"
                                        >
                                          Aprobar Ajuste y Cerrar
                                        </button>
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
                        className="w-full py-3.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 mt-4"
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
                              const esIngreso = m.tipo === 'INGRESO';
                              const montoMostrar = esIngreso ? Number(m.montoRecibido) || Number(m.montoReportado) : (Number(m.montoSalida) || 0) - (Number(m.montoSobranteDevuelto) || 0);

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
                                      {m.solicitudBorrado ? (
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
                    <span className="text-xl font-extrabold text-indigo-950 mt-1 block">{cierresMensuales.length} meses</span>
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
                    {usuariosSistema.some(u => u.solicitudClave) && (
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
                            Selecciona el mes a cerrar. El sistema auditará las entradas, salidas y generará el acta oficial con las palabras del pastor para la firma de tesorería y pastor.
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
                        {cierresMensuales.length === 0 ? (
                          <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                            <p className="text-sm text-slate-500 font-semibold">No hay cierres mensuales ejecutados todavía.</p>
                          </div>
                        ) : (
                          cierresMensuales.map((c) => (
                            <div key={c.id} className="p-6 rounded-2xl border-2 border-indigo-950 bg-white shadow-md space-y-4">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
                                <div>
                                  <span className="text-xs font-mono font-bold bg-indigo-900 text-white px-2.5 py-1 rounded-md">
                                    ACTA DE CIERRE MENSUAL: {c.mes}
                                  </span>
                                  <h4 className="font-extrabold text-slate-900 text-base mt-2">Iglesia - Informe Oficial de Tesorería</h4>
                                </div>
                                <div className="text-right text-xs text-slate-500">
                                  <span>Fecha de corte: <strong>{c.fechaCierre}</strong></span>
                                  <span className="block">Auditor: <strong>{c.responsableCierre}</strong></span>
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

                              <div className="flex justify-end pt-2">
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
                          ))
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
                      {movimientos.filter((m) => m.solicitudBorrado && !m.borradoAutorizado).length === 0 ? (
                        <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                          <p className="text-sm text-slate-500 font-semibold">No hay solicitudes de borrado pendientes por aprobar.</p>
                        </div>
                      ) : (
                        movimientos
                          .filter((m) => m.solicitudBorrado && !m.borradoAutorizado)
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
                      {usuariosSistema.some((u) => u.solicitudClave) ? (
                        <div className="space-y-3">
                          {usuariosSistema
                            .filter((u) => u.solicitudClave)
                            .map((usr) => (
                              <div key={usr.id} className="p-4 rounded-xl bg-amber-50 border border-amber-300 flex items-center justify-between gap-4">
                                <div>
                                  <span className="font-bold text-amber-950 text-sm">El usuario <strong className="underline">{usr.nombre}</strong> (usuario: <em>{usr.usuario}</em>) solicita restablecer su contraseña.</span>
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
                        <form onSubmit={handleCrearUsuarioSystema} className="space-y-3">
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
                          {usuariosSistema.map((u) => (
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
                          ))}
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
                <label className="key block text-xs font-bold uppercase text-slate-600 mb-1">Nueva Contraseña</label>
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
