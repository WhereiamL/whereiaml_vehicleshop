import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Box, Button, Chip, ColorPicker, Group, Paper, Progress,
  ScrollArea, SegmentedControl, Stack, Tabs, Text, ThemeIcon, Title, UnstyledButton,
} from '@mantine/core';
import {
  IconBuildingStore, IconBrush, IconCreditCard, IconDoor, IconKey,
  IconPaint, IconRotate360, IconSteeringWheel, IconStopwatch, IconZoomScan,
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
      radius="md"
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
      <Text size="xs" c="dimmed" ta="center" mt={6}>Press [X] to end early</Text>
    </Paper>
  );
}

export default function App() {
  const [visible, setVisible] = useState(false);
  const [data, setData] = useState(null);
  const [td, setTd] = useState(null);
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
    }
    window.addEventListener('message', handler);
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
    sfx.success();
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
            <Paper className="panel-left" m="md" radius="md" w={380} style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <Group p="md" gap="sm" wrap="nowrap">
                <ThemeIcon size={40} radius="md" variant="light" color="blue"><IconBuildingStore size={22} /></ThemeIcon>
                <Box>
                  <Text size="xs" c="dimmed" fw={700} tt="uppercase" style={{ letterSpacing: 2 }}>Dealership</Text>
                  <Title order={4} c="white">{data.dealership}</Title>
                </Box>
              </Group>

              <Tabs value={activeCat} onChange={(v) => { sfx.tick(); setActiveCat(v); }} variant="pills" px="xs">
                <Tabs.List>
                  {present.map((c) => (
                    <Tabs.Tab key={c.id} value={c.id} size="xs">{c.label}</Tabs.Tab>
                  ))}
                </Tabs.List>
              </Tabs>

              <ScrollArea style={{ flex: 1 }} p="xs">
                <Stack gap={6}>
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

            <Paper className="panel-right" m="md" radius="md" w={420} p="md">
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
                    {data.doors.map((d) => (
                      <Chip key={d.doorIndex} size="xs" checked={!!doorsOpen[d.doorIndex]} onChange={() => toggleDoor(d.doorIndex)}>
                        {d.label}
                      </Chip>
                    ))}
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
                    <ScrollArea h={132}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 6, paddingRight: 8 }}>
                        {PEARL_COLORS.map((c) => (
                          <div
                            key={c.i}
                            className="swatch"
                            title={c.n}
                            onClick={() => changePearl(c.i)}
                            style={{
                              paddingTop: '100%',
                              borderRadius: 4,
                              cursor: 'pointer',
                              background: c.hex,
                              outline: pearl === c.i ? '2px solid var(--mantine-color-blue-5)' : '1px solid rgba(255,255,255,0.12)',
                            }}
                          />
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
                    data={[
                      { label: 'Gloss', value: 'gloss' },
                      { label: 'Metallic', value: 'metallic' },
                      { label: 'Pearl', value: 'pearl' },
                      { label: 'Matte', value: 'matte' },
                    ]}
                  />
                </Box>

                <Box>
                  <SectionLabel icon={<IconCreditCard size={14} />}>Payment</SectionLabel>
                  <SegmentedControl
                    fullWidth value={payment} onChange={(v) => { sfx.click(); setPayment(v); }}
                    data={data.payments
                      .filter((p) => p !== 'finance' || data.finance.enabled)
                      .map((p) => ({ label: PAYMENT_LABELS[p] || p, value: p }))}
                  />
                  {financeInfo && (
                    <Text size="xs" c="dimmed" mt={6}>
                      {money(financeInfo.down)} down · {money(financeInfo.per)} × {financeInfo.count} payments
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
              radius="md" px="sm" py={6}
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
          </Box>
        </>
      )}

      {td && <TestDriveBox td={td} />}
    </>
  );
}
