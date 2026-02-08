@extends('admin.layout')

@section('title', 'Slike')

@section('content')
  <div class="card">
    <h2>Slike: #{{ $proizvod->id }} — {{ $proizvod->title }}</h2>

    <form id="uploadForm" method="post" action="/admin/proizvodi/{{ $proizvod->id }}/slike/upload" enctype="multipart/form-data">
      @csrf
      <div class="row" style="margin:12px 0;">
        <input type="file" name="file" required />
        <input type="text" name="alt" placeholder="ALT tekst (opciono)" style="min-width:280px;" />
        <button type="submit">Upload</button>
      </div>
    </form>

    <div id="gal" class="row">
      @foreach($slike as $s)
        <div class="card" style="width:220px;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <small class="muted">id={{ $s->id }} | #{{ $s->sort_order }}</small>
          </div>
          <div style="margin-top:10px;">
            <img src="{{ $s->thumb_url ?: $s->url }}" style="width:100%; border-radius:12px; border:1px solid #eee;" />
          </div>

          <div style="margin-top:10px;">
            <small class="muted">{{ $s->alt }}</small>
          </div>

          <div class="row" style="margin-top:10px;">
            <button type="button" class="secondary" onclick="moveUp({{ $s->id }})">↑</button>
            <button type="button" class="secondary" onclick="moveDown({{ $s->id }})">↓</button>

            <form method="post" action="/admin/slike/{{ $s->id }}/obrisi" onsubmit="return confirm('Obrisati sliku?')">
              @csrf
              <button type="submit">Obriši</button>
            </form>
          </div>
        </div>
      @endforeach
    </div>

    <div style="margin-top:14px;">
      <button type="button" onclick="snimiRedosled()">Sačuvaj redosled</button>
      <a href="/admin/proizvodi/{{ $proizvod->id }}/izmena" style="margin-left:10px;">Nazad na izmenu</a>
    </div>
  </div>

<script>
  // trenutni niz IDs iz DOM-a
  function getIds() {
    return Array.from(document.querySelectorAll('#gal .card'))
      .map(card => card.querySelector('small.muted')?.textContent)
      .map(txt => {
        // txt: "id=2 | #0"
        const m = (txt || '').match(/id=(\d+)/);
        return m ? parseInt(m[1], 10) : null;
      })
      .filter(Boolean);
  }

  function moveUp(id) {
    const cards = Array.from(document.querySelectorAll('#gal .card'));
    const i = cards.findIndex(c => c.querySelector('small.muted')?.textContent.includes('id='+id));
    if (i > 0) cards[i].parentNode.insertBefore(cards[i], cards[i-1]);
  }

  function moveDown(id) {
    const cards = Array.from(document.querySelectorAll('#gal .card'));
    const i = cards.findIndex(c => c.querySelector('small.muted')?.textContent.includes('id='+id));
    if (i >= 0 && i < cards.length - 1) cards[i].parentNode.insertBefore(cards[i+1], cards[i]);
  }

  async function snimiRedosled() {
    const ids = getIds();

    const res = await fetch('/admin/proizvodi/{{ $proizvod->id }}/slike/redosled', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ids})
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      alert('Greška: ' + (data.poruka || res.status));
      return;
    }
    location.reload();
  }
</script>
@endsection
