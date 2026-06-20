import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, ColorPicker, SegmentedControl, Tabs } from '@mantine/core';
import { fetchNui, isBrowser } from './fetchNui.js';

function hexToRgb(hex) {
  const v = hex.replace('#', '');
  return {
    r: parseInt(v.slice(0, 2), 16),
    g: parseInt(v.slice(2, 4), 16),
    b: parseInt(v.slice(4, 6), 16),
  };
}

function rgbToHex(c) {
  const h = (n) => n.toString(16).padStart(2, '0');
  return `#${h(c.r)}${h(c.g)}${h(c.b)}`;
}

function money(n) {
  return '$' + Math.round(n).toLocaleString('en-US');
}

const PAYMENT_LABELS = { cash: 'Cash', bank: 'Bank', finance: 'Finance' };

const MOCK = {
  catalog: [
    { model: 'adder', name: 'Adder', brand: 'Truffade', price: 1000000, category: 'super' },
    { model: 'sultan', name: 'Sultan', brand: 'Karin', price: 45000, category: 'sports' },
    { model: 'blista', name: 'Blista', brand: 'Dinka', price: 16000, category: 'compacts' },
  ],
  categories: [
    { id: 'compacts', label: 'Compacts' },
    { id: 'sports', label: 'Sports' },
    { id: 'super', label: 'Super' },
  ],
  doors: [
    { doorIndex: 4, label: 'Hood' },
    { doorIndex: 5, label: 'Trunk' },
    { doorIndex: 0, label: 'Door FL' },
    { doorIndex: 1, label: 'Door FR' },
  ],
  payments: ['cash', 'bank', 'finance'],
  finance: { enabled: true, downPercent: 20, interestPercent: 10, maxPayments: 12 },
  dealership: 'Premium Deluxe Motorsport',
  colors: { primary: { r: 120, g: 0, b: 0 }, secondary: { r: 20, g: 20, b: 20 } },
  selected: 'adder',
};

export default function App() {
  const [visible, setVisible] = useState(false);
  const [data, setData] = useState(null);
  const [activeCat, setActiveCat] = useState(null);
  const [selected, setSelected] = useState(null);
  const [primary, setPrimary] = useState('#780000');
  const [secondary, setSecondary] = useState('#141414');
  const [colorTab, setColorTab] = useState('primary');
  const [doorsOpen, setDoorsOpen] = useState({});
  const [payment, setPayment] = useState('cash');
  const [imgError, setImgError] = useState({});
  const [buying, setBuying] = useState(false);
  const drag = useRef({ down: false, dx: 0, dy: 0, raf: 0 });

  function applyOpen(payload) {
    setData(payload);
    setSelected(payload.selected);
    const sel = payload.catalog.find((c) => c.model === payload.selected);
    setActiveCat(sel ? sel.category : payload.catalog[0]?.category);
    setPrimary(rgbToHex(payload.colors.primary));
    setSecondary(rgbToHex(payload.colors.secondary));
    setDoorsOpen({});
    setPayment(payload.payments[0]);
    setVisible(true);
  }

  useEffect(() => {
    function handler(e) {
      const msg = e.data;
      if (msg.action === 'open') applyOpen(msg);
      else if (msg.action === 'close') setVisible(false);
    }
    window.addEventListener('message', handler);
    if (isBrowser) applyOpen(MOCK);
    return () => window.removeEventListener('message', handler);
  }, []);

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape' && visible) close();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [visible]);

  const present = useMemo(() => {
    if (!data) return [];
    const used = new Set(data.catalog.map((c) => c.category));
    return data.categories.filter((c) => used.has(c.id));
  }, [data]);

  const shown = useMemo(() => {
    if (!data) return [];
    return data.catalog.filter((c) => c.category === activeCat);
  }, [data, activeCat]);

  const current = useMemo(
    () => (data ? data.catalog.find((c) => c.model === selected) : null),
    [data, selected],
  );

  function selectCar(model) {
    setSelected(model);
    setDoorsOpen({});
    fetchNui('selectVehicle', { model });
  }

  function changeColor(hex) {
    const rgb = hexToRgb(hex);
    if (colorTab === 'primary') setPrimary(hex);
    else setSecondary(hex);
    fetchNui('setColor', { slot: colorTab, color: rgb });
  }

  function toggleDoor(doorIndex) {
    const open = !doorsOpen[doorIndex];
    setDoorsOpen((d) => ({ ...d, [doorIndex]: open }));
    fetchNui('toggleDoor', { doorIndex, open });
  }

  async function buy() {
    if (buying || !current) return;
    setBuying(true);
    await fetchNui('buy', { model: current.model, payment });
    setBuying(false);
  }

  function testDrive() {
    if (current) fetchNui('testDrive', { model: current.model });
  }

  function close() {
    setVisible(false);
    fetchNui('close');
  }

  function onPointerDown(e) {
    drag.current.down = true;
    e.currentTarget.classList.add('dragging');
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function flush() {
    drag.current.raf = 0;
    const { dx, dy } = drag.current;
    drag.current.dx = 0;
    drag.current.dy = 0;
    if (dx || dy) fetchNui('rotate', { dx, dy });
  }
  function onPointerMove(e) {
    if (!drag.current.down) return;
    drag.current.dx += e.movementX;
    drag.current.dy += e.movementY;
    if (!drag.current.raf) drag.current.raf = requestAnimationFrame(flush);
  }
  function onPointerUp(e) {
    drag.current.down = false;
    e.currentTarget.classList.remove('dragging');
  }
  function onWheel(e) {
    fetchNui('zoom', { delta: e.deltaY > 0 ? -1 : 1 });
  }

  const financeInfo = useMemo(() => {
    if (!data || !current || payment !== 'finance') return null;
    const f = data.finance;
    const down = Math.floor((current.price * f.downPercent) / 100);
    const principal = current.price - down;
    const total = Math.floor(principal * (1 + f.interestPercent / 100));
    const per = Math.ceil(total / f.maxPayments);
    return { down, per, count: f.maxPayments };
  }, [data, current, payment]);

  if (!visible || !data) return null;

  return (
    <div className="shell">
      <div
        className="stage"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onWheel={onWheel}
      />

      <div className="panel left">
        <div className="brandbar">
          <div className="kicker">Dealership</div>
          <div className="name">{data.dealership}</div>
        </div>
        <Tabs value={activeCat} onChange={setActiveCat} variant="pills" color="amber" px="xs" pt="xs">
          <Tabs.List>
            {present.map((c) => (
              <Tabs.Tab key={c.id} value={c.id}>
                {c.label}
              </Tabs.Tab>
            ))}
          </Tabs.List>
        </Tabs>
        <div className="list">
          {shown.map((c) => (
            <div
              key={c.model}
              className={`car-row${c.model === selected ? ' active' : ''}`}
              onClick={() => selectCar(c.model)}
            >
              <div className="meta">
                <div className="brand">{c.brand}</div>
                <div className="model">{c.name}</div>
              </div>
              <div className="price">{money(c.price)}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="panel right">
        <div className="hero">
          {current && !imgError[current.model] ? (
            <img
              src={`../images/${current.model}.png`}
              alt={current.name}
              onError={() => setImgError((m) => ({ ...m, [current.model]: true }))}
            />
          ) : (
            <div className="placeholder">🚗</div>
          )}
        </div>

        {current && (
          <div className="title-row">
            <div>
              <div className="t-brand">{current.brand}</div>
              <div className="t-model">{current.name}</div>
            </div>
            <div className="t-price">{money(current.price)}</div>
          </div>
        )}

        <div>
          <div className="section-label">Doors</div>
          <div className="doors">
            {data.doors.map((d) => (
              <div
                key={d.doorIndex}
                className={`door-chip${doorsOpen[d.doorIndex] ? ' open' : ''}`}
                onClick={() => toggleDoor(d.doorIndex)}
              >
                {d.label}
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="section-label">Paint</div>
          <SegmentedControl
            fullWidth
            size="xs"
            color="amber"
            value={colorTab}
            onChange={setColorTab}
            data={[
              { label: 'Primary', value: 'primary' },
              { label: 'Secondary', value: 'secondary' },
            ]}
            mb="xs"
          />
          <ColorPicker
            fullWidth
            format="hex"
            value={colorTab === 'primary' ? primary : secondary}
            onChange={changeColor}
            swatches={['#780000', '#141414', '#ffffff', '#c0c0c0', '#1d3557', '#2a9d8f', '#e9c46a', '#e76f51', '#6a4c93', '#000000']}
          />
        </div>

        <div>
          <div className="section-label">Payment</div>
          <SegmentedControl
            fullWidth
            color="amber"
            value={payment}
            onChange={setPayment}
            data={data.payments
              .filter((p) => p !== 'finance' || data.finance.enabled)
              .map((p) => ({ label: PAYMENT_LABELS[p] || p, value: p }))}
          />
          {financeInfo && (
            <div style={{ fontSize: 12, color: '#8c93a3', marginTop: 6 }}>
              {money(financeInfo.down)} down · {money(financeInfo.per)} × {financeInfo.count} payments
            </div>
          )}
        </div>

        <div className="actions">
          <Button variant="default" onClick={testDrive} fullWidth>
            Test Drive
          </Button>
          <Button color="amber" onClick={buy} loading={buying} fullWidth>
            {payment === 'finance' ? 'Finance' : 'Buy'}
          </Button>
        </div>
        <Button variant="subtle" color="gray" size="xs" onClick={close}>
          Close (ESC)
        </Button>
      </div>

      <div className="hint">Drag to rotate · Scroll to zoom</div>
    </div>
  );
}
