@extends('admin.layout')

@section('title', 'Proizvodi')

@section('content')
  <div class="card">
    <h2>Proizvodi</h2>

    <form method="get" action="/admin/proizvodi" class="row" style="margin: 12px 0;">
      <input name="q" value="{{ $q }}" placeholder="Pretraga (title/slug)..." style="min-width:280px;" />
      <button type="submit">Traži</button>
    </form>

    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Naziv</th>
          <th>Cena</th>
          <th>Status</th>
          <th>Akcije</th>
        </tr>
      </thead>
      <tbody>
      @foreach($proizvodi as $p)
        <tr>
          <td>{{ $p->id }}</td>
          <td>
            <div><strong>{{ $p->title }}</strong></div>
            <small class="muted">{{ $p->slug }}</small>
          </td>
          <td>{{ $p->price_rsd }} RSD</td>
          <td>
            <small class="muted">
              active={{ (int)$p->is_active }},
              stock={{ (int)$p->in_stock }},
              sale={{ (int)$p->is_on_sale }}
            </small>
          </td>
          <td>
            <a href="/admin/proizvodi/{{ $p->id }}/izmena">Izmena</a>
            &nbsp;|&nbsp;
            <a href="/admin/proizvodi/{{ $p->id }}/slike">Slike</a>
          </td>
        </tr>
      @endforeach
      </tbody>
    </table>

    <div style="margin-top:12px;">
      {{ $proizvodi->links() }}
    </div>
  </div>
@endsection
