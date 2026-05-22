#!/bin/bash

VPS="http://187.77.55.131"
KEY="${1:-zika}"
USERS=500
DURATION=30

MANIFEST_URL="$VPS/hls/$KEY.m3u8"

echo "=========================================="
echo "  TESTE DE CARGA — FutZone HLS/VPS"
echo "=========================================="
echo "  Alvo   : $MANIFEST_URL"
echo "  Usuários: $USERS simultâneos"
echo "  Duração : ${DURATION}s"
echo "=========================================="
echo ""

# Verifica se a stream está ativa
echo "▶ Verificando stream..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "$MANIFEST_URL")
if [ "$STATUS" != "200" ]; then
  echo "✗ Stream não encontrada (HTTP $STATUS). Verifique se o OBS está transmitindo com a chave '$KEY'."
  exit 1
fi
echo "✓ Stream ativa (HTTP 200)"
echo ""

# Pega um segmento .ts do manifest para testar também
TS_FILE=$(curl -s "$MANIFEST_URL" | grep '\.ts' | tail -1)
TS_URL=""
if [ -n "$TS_FILE" ]; then
  TS_URL="$VPS/hls/$TS_FILE"
  echo "✓ Segmento encontrado: $TS_FILE"
fi
echo ""

ulimit -n 2048 2>/dev/null

# --- Fase 1: Manifest (.m3u8) ---
echo "------------------------------------------"
echo "  FASE 1 — Manifest (.m3u8)"
echo "  (simula $USERS players abrindo a stream)"
echo "------------------------------------------"
ab -n $((USERS * 10)) -c $USERS -t $DURATION "$MANIFEST_URL" 2>&1
echo ""

# --- Fase 2: Segmentos (.ts) ---
if [ -n "$TS_URL" ]; then
  echo "------------------------------------------"
  echo "  FASE 2 — Segmentos (.ts)"
  echo "  (simula $USERS players baixando vídeo)"
  echo "------------------------------------------"
  ab -n $((USERS * 4)) -c $USERS -t $DURATION "$TS_URL" 2>&1
  echo ""
fi

echo "=========================================="
echo "  INTERPRETAÇÃO"
echo "=========================================="
echo "  Failed requests = 0      → ótimo"
echo "  Time per request < 500ms → ótimo"
echo "  Time per request < 2000ms → aceitável"
echo "  Time per request > 2000ms → VPS sobrecarregada"
echo "=========================================="
