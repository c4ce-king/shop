@extends('admin.layout')

@section('title', 'Izmena proizvoda')

@section('content')
  <div class="card">
    <h2>Izmena: #{{ $proizvod->id }}</h2>
    <p><small class="muted">Slug: {{ $proizvod->slug }}</small></p>

    <form method="post" action="/admin/proizvodi/{{ $proizvod->id }}/izmena">
      @csrf

      <div class="row">
        <div style="flex:1; min-width:260px;">
          <label>Title</label><br />
          <input name="title" value="{{ old('title',$proizvod->title) }}" style="width:100%;" />
        </div>

        <div>
          <label>Cena (RSD)</label><br />
          <input name="price_rsd" type="number" value="{{ old('price_rsd',$proizvod->price_rsd) }}" />
        </div>

        <div>
          <label>Stara cena (RSD)</label><br />
          <input name="compare_at_rsd" type="number" value="{{ old('compare_at_rsd',$proizvod->compare_at_rsd) }}" />
        </div>
      </div>

      <div class="row" style="margin-top:12px;">
        <label><input type="checkbox" name="is_active" value="1" {{ $proizvod->is_active ? 'checked' : '' }} /> Aktivno</label>
        <label><input type="checkbox" name="in_stock" value="1" {{ $proizvod->in_stock ? 'checked' : '' }} /> Na stanju</label>
        <label><input type="checkbox" name="is_on_sale" value="1" {{ $proizvod->is_on_sale ? 'checked' : '' }} /> Akcija</label>
        <label><input type="checkbox" name="noindex" value="1" {{ $proizvod->noindex ? 'checked' : '' }} /> noindex</label>
      </div>

      <hr style="margin:16px 0; border:none; border-top:1px solid #eee;" />

      <h3>SEO</h3>
      <div class="row">
        <div style="flex:1; min-width:260px;">
          <label>SEO title</label><br />
          <input name="seo_title" value="{{ old('seo_title',$proizvod->seo_title) }}" style="width:100%;" />
        </div>
        <div style="flex:1; min-width:260px;">
          <label>SEO description</label><br />
          <input name="seo_description" value="{{ old('seo_description',$proizvod->seo_description) }}" style="width:100%;" />
        </div>
      </div>

      <div style="margin-top:14px;">
        <button type="submit">Sačuvaj</button>
        <a href="/admin/proizvodi/{{ $proizvod->id }}/slike" style="margin-left:10px;">Slike</a>
      </div>
    </form>
  </div>
@endsection
