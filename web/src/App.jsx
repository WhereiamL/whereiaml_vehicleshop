import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActionIcon, Box, Button, ColorPicker, Group, Kbd, Paper, Progress,
  ScrollArea, SegmentedControl, Stack, Tabs, Text, TextInput, ThemeIcon, Title, Tooltip, UnstyledButton,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconBackspace, IconBuildingBank, IconBuildingStore, IconBrush, IconCash, IconCreditCard, IconDoor, IconKey,
  IconPaint, IconReceipt2, IconRotate360, IconSearch, IconSteeringWheel, IconStopwatch, IconX, IconZoomScan,
} from '@tabler/icons-react';
import { fetchNui } from './fetchNui.js';
import { sfx } from './sound.js';
import { PEARL_COLORS } from './pearlColors.js';

function hexToRgb(hex) {
  const v = hex.replace('#', '');
  return { r: parseInt(v.slice(0, 2), 16), g: parseInt(v.slice(2, 4), 16), b: parseInt(v.slice(4, 6), 16) };
}
function rgbToHex(c) {
  const h = (n) => n.toString(16).padStart(2, '0');
  return `#${h(c.r)}${h(c.g)}${h(c.b)}`;
}
function money(n) {
  return '$' + Math.round(n).toLocaleString('en-US');
}
function clock(s) {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

const PAYMENT_LABELS = { cash: 'Cash', bank: 'Bank', finance: 'Finance' };

const FINISH_INFO = {
  gloss: 'Classic glossy paint.',
  metallic: 'Shiny metallic flake finish.',
  pearl: 'Pearlescent sheen that shifts under light.',
  matte: 'Flat, non-reflective finish.',
};

function SectionLabel({ icon, children }) {
  return (
    <Group gap={6} mb={8}>
      <ThemeIcon size="sm" radius="sm" variant="light" color="blue">{icon}</ThemeIcon>
      <Text size="xs" c="dimmed" fw={700} tt="uppercase" style={{ letterSpacing: 1 }}>{children}</Text>
    </Group>
  );
}

function TestDriveBox({ td }) {
  const pct = td.total ? Math.max(0, (td.seconds / td.total) * 100) : 0;
  return (
    <Paper
      className="td-box"
      p="sm"
      radius="sm"
      withBorder
      style={{
        position: 'fixed',
        bottom: '10vh',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 2,
        pointerEvents: 'none',
        minWidth: 280,
        backgroundColor: 'rgba(24,24,27,0.95)',
        border: '1px solid rgba(255,255,255,0.10)',
      }}
    >
      <Group gap="sm" wrap="nowrap">
        <ThemeIcon size={42} radius="md" variant="light" color="blue">
          <IconStopwatch size={24} />
        </ThemeIcon>
        <Box style={{ flex: 1 }}>
          <Text size="xs" c="dimmed" fw={700} tt="uppercase" style={{ letterSpacing: 1 }}>Test drive</Text>
          <Text size="lg" fw={800} c="white">Ends in {clock(td.seconds)}</Text>
          <Progress value={pct} size="xs" color="blue" mt={4} />
        </Box>
      </Group>
      <Group justify="center" gap={6} mt={8} wrap="nowrap">
        <Kbd style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', fontWeight: 700 }}>
          <IconBackspace size={16} /> Backspace
        </Kbd>
        <Text size="xs" c="dimmed">to end early</Text>
      </Group>
    </Paper>
  );
}

function LoansPanel({ loans, onPayoff, onClose, busyId }) {
  return (
    <Box
      style={{
        position: 'fixed', inset: 0, zIndex: 3, pointerEvents: 'auto',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.45)',
      }}
    >
      <Paper className="panel-pop" radius="sm" w={460} p="lg" style={{ backgroundColor: 'rgba(24,24,27,0.97)', border: '1px solid rgba(255,255,255,0.10)' }}>
        <Group justify="space-between" mb="md">
          <Group gap="sm">
            <ThemeIcon size={36} radius="sm" variant="light" color="blue"><IconReceipt2 size={20} /></ThemeIcon>
            <Box>
              <Text size="xs" c="dimmed" fw={700} tt="uppercase" style={{ letterSpacing: 2 }}>Active Finance</Text>
              <Title order={4} c="white">My Loans</Title>
            </Box>
          </Group>
          <ActionIcon variant="subtle" color="gray" onClick={onClose}><IconX size={18} /></ActionIcon>
        </Group>

        {loans.length === 0 ? (
          <Text c="dimmed" ta="center" py="xl">You have no active loans.</Text>
        ) : (
          <Stack gap="xs">
            {loans.map((l) => (
              <Paper key={l.id} radius="sm" p="sm" style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <Group justify="space-between" align="flex-start">
                  <Box>
                    <Text fw={700} c="white">{l.label}</Text>
                    <Text size="xs" c="dimmed">{l.payments_left} payments left · {money(l.payment_amount)} each</Text>
                  </Box>
                  <Box ta="right">
                    <Text size="xs" c="dimmed">Balance</Text>
                    <Text fw={800} c="blue.4">{money(l.balance)}</Text>
                  </Box>
                </Group>
                <Button mt="sm" fullWidth size="xs" loading={busyId === l.id} onClick={() => onPayoff(l.id)}>
                  Pay off {money(l.balance)}
                </Button>
              </Paper>
            ))}
          </Stack>
        )}
      </Paper>
    </Box>
  );
}

export default function App() {
  const [visible, setVisible] = useState(false);
  const [data, setData] = useState(null);
  const [wallet, setWallet] = useState({ cash: 0, bank: 0 });
  const [search, setSearch] = useState('');
  const [td, setTd] = useState(null);
  const [loans, setLoans] = useState(null);
  const [loanBusy, setLoanBusy] = useState(null);
  const [activeCat, setActiveCat] = useState(null);
  const [selected, setSelected] = useState(null);
  const [primary, setPrimary] = useState('#780000');
  const [secondary, setSecondary] = useState('#141414');
  const [colorTab, setColorTab] = useState('primary');
  const [finish, setFinish] = useState('gloss');
  const [pearl, setPearl] = useState(0);
  const [doorsOpen, setDoorsOpen] = useState({});
  const [payment, setPayment] = useState('cash');
  const [imgError, setImgError] = useState({});
  const [buying, setBuying] = useState(false);
  const drag = useRef({ down: false, dx: 0, dy: 0, raf: 0 });

  function applyOpen(payload) {
    setData(payload);
    if (payload.money) setWallet(payload.money);
    setSearch('');
    setSelected(payload.selected);
    const sel = payload.catalog.find((c) => c.model === payload.selected);
    setActiveCat(sel ? sel.category : payload.catalog[0]?.category);
    setPrimary(rgbToHex(payload.colors.primary));
    setSecondary(rgbToHex(payload.colors.secondary));
    setFinish('gloss');
    setPearl(0);
    setDoorsOpen({});
    setPayment(payload.payments[0]);
    setVisible(true);
  }

  useEffect(() => {
    function handler(e) {
      const msg = e.data;
      if (msg.action === 'open') applyOpen(msg);
      else if (msg.action === 'close') setVisible(false);
      else if (msg.action === 'testdrive') {
        if (msg.state === 'stop') setTd(null);
        else setTd({ seconds: msg.seconds, total: msg.total });
      }
      else if (msg.action === 'notify') {
        const color = msg.notifyType === 'error' ? 'red' : msg.notifyType === 'success' ? 'teal' : 'blue';
        if (msg.notifyType === 'success') sfx.success();
        else sfx.click();
        notifications.show({ color, title: msg.title, message: msg.message, autoClose: 4500 });
      }
      else if (msg.action === 'loans') {
        sfx.tick();
        setLoans(msg.loans || []);
      }
    }
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  useEffect(() => {
    function onKey(e) {
      if (e.key !== 'Escape') return;
      if (loans !== null) closeLoans();
      else if (visible) close();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [visible, loans]);

  const present = useMemo(() => {
    if (!data) return [];
    const used = new Set(data.catalog.map((c) => c.category));
    return data.categories.filter((c) => used.has(c.id));
  }, [data]);

  const shown = useMemo(() => {
    if (!data) return [];
    const q = search.trim().toLowerCase();
    if (q) return data.catalog.filter((c) => `${c.name} ${c.brand}`.toLowerCase().includes(q));
    return data.catalog.filter((c) => c.category === activeCat);
  }, [data, activeCat, search]);

  const current = useMemo(
    () => (data ? data.catalog.find((c) => c.model === selected) : null),
    [data, selected],
  );

  function selectCar(model) {
    sfx.select();
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
  function changeFinish(v) {
    sfx.click();
    setFinish(v);
    fetchNui('setFinish', { finish: v });
  }
  function changePearl(i) {
    sfx.click();
    setPearl(i);
    fetchNui('setPearl', { index: i });
  }
  function toggleDoor(doorIndex) {
    sfx.click();
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
    if (!current) return;
    sfx.click();
    fetchNui('testDrive', { model: current.model });
  }
  function close() {
    sfx.tick();
    setVisible(false);
    fetchNui('close');
  }
  function closeLoans() {
    sfx.tick();
    setLoans(null);
    fetchNui('closeLoans');
  }
  async function payoffLoan(id) {
    if (loanBusy) return;
    setLoanBusy(id);
    const res = await fetchNui('payoff', { id });
    setLoanBusy(null);
    if (res && res.ok) {
      const fresh = await fetchNui('getFinances');
      setLoans(Array.isArray(fresh) ? fresh : []);
    }
  }
  function paymentDesc(p) {
    if (!data) return '';
    if (p === 'cash') return 'Pay the full price in cash right now.';
    if (p === 'bank') return 'Pay the full price from your bank account.';
    if (p === 'finance') {
      const f = data.finance;
      return `Pay ${f.downPercent}% down, then ${f.maxPayments} installments charged ${f.dueText || 'on schedule'}.`;
    }
    return '';
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

  return (
    <>
      {visible && data && (
        <>
          <div
            className="stage"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onWheel={onWheel}
          />

          <Box className="shell">
            <Paper className="panel-left" m="md" radius="sm" w={380} style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <Group p="md" gap="sm" wrap="nowrap">
                <ThemeIcon size={40} radius="md" variant="light" color="blue"><IconBuildingStore size={22} /></ThemeIcon>
                <Box>
                  <Text size="xs" c="dimmed" fw={700} tt="uppercase" style={{ letterSpacing: 2 }}>Dealership</Text>
                  <Title order={4} c="white">{data.dealership}</Title>
                </Box>
              </Group>

              <Box px="md" pb="xs">
                <TextInput
                  size="xs"
                  value={search}
                  onChange={(e) => setSearch(e.currentTarget.value)}
                  placeholder="Search vehicles…"
                  leftSection={<IconSearch size={14} />}
                />
              </Box>

              {!search && (
                <Tabs value={activeCat} onChange={(v) => { sfx.tick(); setActiveCat(v); }} variant="pills" px="xs">
                  <Tabs.List>
                    {present.map((c) => (
                      <Tabs.Tab key={c.id} value={c.id} size="xs">{c.label}</Tabs.Tab>
                    ))}
                  </Tabs.List>
                </Tabs>
              )}

              <ScrollArea style={{ flex: 1 }} p="xs" offsetScrollbars scrollbarSize={8}>
                <Stack gap={6} pr={6}>
                  {shown.length === 0 && (
                    <Text size="xs" c="dimmed" ta="center" mt="md">No vehicles found.</Text>
                  )}
                  {shown.map((c) => {
                    const active = c.model === selected;
                    return (
                      <UnstyledButton key={c.model} onClick={() => selectCar(c.model)}>
                        <Paper
                          className="car-row-anim"
                          p="xs"
                          radius="sm"
                          style={{
                            backgroundColor: active ? 'rgba(34,139,230,0.15)' : 'rgba(255,255,255,0.02)',
                            border: active ? '1px solid var(--mantine-color-blue-6)' : '1px solid transparent',
                          }}
                        >
                          <Group justify="space-between" wrap="nowrap">
                            <Box style={{ minWidth: 0 }}>
                              <Text size="xs" c="dimmed" tt="uppercase">{c.brand}</Text>
                              <Text size="sm" fw={600} c="white" truncate>{c.name}</Text>
                            </Box>
                            <Text size="sm" fw={700} c="blue.4">{money(c.price)}</Text>
                          </Group>
                        </Paper>
                      </UnstyledButton>
                    );
                  })}
                </Stack>
              </ScrollArea>
            </Paper>

            <Paper className="panel-right" m="md" radius="sm" w={420} p="md">
              <Stack gap="md" h="100%">
                <Box
                  h={150}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    borderRadius: 8,
                    background: 'radial-gradient(ellipse at center, rgba(34,139,230,0.10), transparent 70%)',
                  }}
                >
                  {current && !imgError[current.model] ? (
                    <img
                      key={current.model}
                      className="car-img"
                      src={`../images/${current.model}.png`}
                      alt={current.name}
                      onError={() => setImgError((m) => ({ ...m, [current.model]: true }))}
                      style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', filter: 'drop-shadow(0 16px 20px rgba(0,0,0,0.6))' }}
                    />
                  ) : (
                    <Text size="48px" c="dimmed">🚗</Text>
                  )}
                </Box>

                {current && (
                  <Group justify="space-between" align="flex-end">
                    <Box>
                      <Text size="xs" c="dimmed" tt="uppercase">{current.brand}</Text>
                      <Title order={3} c="white">{current.name}</Title>
                    </Box>
                    <Text size="xl" fw={800} c="blue.4">{money(current.price)}</Text>
                  </Group>
                )}

                <Box>
                  <SectionLabel icon={<IconDoor size={14} />}>Doors</SectionLabel>
                  <Group gap={6}>
                    {data.doors.map((d) => {
                      const open = !!doorsOpen[d.doorIndex];
                      return (
                        <Button
                          key={d.doorIndex}
                          size="xs"
                          radius="sm"
                          w={92}
                          px={6}
                          color="blue"
                          variant={open ? 'filled' : 'default'}
                          onClick={() => toggleDoor(d.doorIndex)}
                        >
                          {d.label}
                        </Button>
                      );
                    })}
                  </Group>
                </Box>

                <Box>
                  <SectionLabel icon={<IconPaint size={14} />}>Paint</SectionLabel>
                  <SegmentedControl
                    fullWidth size="xs" mb="xs"
                    value={colorTab} onChange={(v) => { sfx.tick(); setColorTab(v); }}
                    data={[
                      { label: 'Primary', value: 'primary' },
                      { label: 'Secondary', value: 'secondary' },
                      { label: 'Pearl', value: 'pearl' },
                    ]}
                  />
                  {colorTab === 'pearl' ? (
                    <ScrollArea h={150} offsetScrollbars scrollbarSize={8} type="always">
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 7, padding: '3px 10px 3px 3px' }}>
                        {PEARL_COLORS.map((c) => (
                          <Tooltip key={c.i} label={c.n} openDelay={250} withArrow>
                            <div
                              className="swatch"
                              onClick={() => changePearl(c.i)}
                              style={{
                                paddingTop: '100%',
                                borderRadius: 3,
                                cursor: 'pointer',
                                background: c.hex,
                                outline: pearl === c.i ? '2px solid var(--mantine-color-blue-5)' : '1px solid rgba(255,255,255,0.14)',
                                outlineOffset: 1,
                              }}
                            />
                          </Tooltip>
                        ))}
                      </div>
                    </ScrollArea>
                  ) : (
                    <ColorPicker
                      fullWidth format="hex"
                      value={colorTab === 'primary' ? primary : secondary}
                      onChange={changeColor}
                      swatches={['#780000', '#141414', '#ffffff', '#c0c0c0', '#1d3557', '#2a9d8f', '#e9c46a', '#e76f51', '#6a4c93', '#000000']}
                    />
                  )}
                  <Group gap={4} mt={8} mb={4}>
                    <IconBrush size={13} color="var(--mantine-color-dimmed)" />
                    <Text size="xs" c="dimmed" fw={700} tt="uppercase" style={{ letterSpacing: 1 }}>Finish</Text>
                  </Group>
                  <SegmentedControl
                    fullWidth size="xs"
                    value={finish} onChange={changeFinish}
                    data={['gloss', 'metallic', 'pearl', 'matte'].map((v) => ({
                      value: v,
                      label: (
                        <Tooltip label={FINISH_INFO[v]} openDelay={200} withArrow position="bottom">
                          <span>{v.charAt(0).toUpperCase() + v.slice(1)}</span>
                        </Tooltip>
                      ),
                    }))}
                  />
                </Box>

                <Box>
                  <SectionLabel icon={<IconCreditCard size={14} />}>Payment</SectionLabel>
                  <SegmentedControl
                    fullWidth value={payment} onChange={(v) => { sfx.click(); setPayment(v); }}
                    data={data.payments
                      .filter((p) => p !== 'finance' || data.finance.enabled)
                      .map((p) => ({
                        value: p,
                        label: (
                          <Tooltip label={paymentDesc(p)} openDelay={200} withArrow position="bottom" multiline w={220}>
                            <span>{PAYMENT_LABELS[p] || p}</span>
                          </Tooltip>
                        ),
                      }))}
                  />
                  <Text size="xs" c="dimmed" mt={6}>{paymentDesc(payment)}</Text>
                  {financeInfo && payment === 'finance' && (
                    <Text size="xs" c="blue.4" fw={600} mt={2}>
                      {money(financeInfo.down)} down · {money(financeInfo.per)} × {financeInfo.count}
                    </Text>
                  )}
                </Box>

                <Group gap="xs" mt="auto" grow>
                  <Button variant="default" leftSection={<IconSteeringWheel size={18} />} onClick={testDrive}>Test Drive</Button>
                  <Button leftSection={<IconKey size={18} />} onClick={buy} loading={buying}>
                    {payment === 'finance' ? 'Finance' : 'Buy'}
                  </Button>
                </Group>
                <Button variant="subtle" color="gray" size="xs" onClick={close}>Close (ESC)</Button>
              </Stack>
            </Paper>

            <Paper
              className="hint-box"
              radius="sm" px="sm" py={6}
              style={{
                position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
                pointerEvents: 'none', backgroundColor: 'rgba(24,24,27,0.9)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <Group gap="lg">
                <Group gap={6}>
                  <ThemeIcon size="sm" radius="sm" variant="light" color="blue"><IconRotate360 size={14} /></ThemeIcon>
                  <Text size="xs" c="dimmed">Drag to rotate</Text>
                </Group>
                <Group gap={6}>
                  <ThemeIcon size="sm" radius="sm" variant="light" color="blue"><IconZoomScan size={14} /></ThemeIcon>
                  <Text size="xs" c="dimmed">Scroll to zoom</Text>
                </Group>
              </Group>
            </Paper>

            <Paper
              className="money-bar"
              radius="sm" px="md" py={6}
              style={{
                position: 'fixed', top: 18, left: '50%', transform: 'translateX(-50%)',
                pointerEvents: 'none', backgroundColor: 'rgba(24,24,27,0.92)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <Group gap="lg">
                <Group gap={6}>
                  <ThemeIcon size="sm" radius="sm" variant="light" color="teal"><IconCash size={15} /></ThemeIcon>
                  <Text size="sm" fw={700} c="white">{money(wallet.cash)}</Text>
                </Group>
                <Group gap={6}>
                  <ThemeIcon size="sm" radius="sm" variant="light" color="blue"><IconBuildingBank size={15} /></ThemeIcon>
                  <Text size="sm" fw={700} c="white">{money(wallet.bank)}</Text>
                </Group>
              </Group>
            </Paper>
          </Box>
        </>
      )}

      {td && <TestDriveBox td={td} />}
      {loans !== null && <LoansPanel loans={loans} onPayoff={payoffLoan} onClose={closeLoans} busyId={loanBusy} />}
    </>
  );
}
