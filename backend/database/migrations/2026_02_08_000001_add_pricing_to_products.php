<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            // Nabavna/neto u RSD (osnovica pre marže i PDV)
            $table->unsignedInteger('cost_rsd')->default(0)->after('id');

            // MP marža
            $table->decimal('mp_margin_percent', 5, 2)->default(20.00)->after('cost_rsd');
            $table->unsignedInteger('mp_margin_fixed_rsd')->default(0)->after('mp_margin_percent');

            // VP marža
            $table->decimal('vp_margin_percent', 5, 2)->default(20.00)->after('mp_margin_fixed_rsd');
            $table->unsignedInteger('vp_margin_fixed_rsd')->default(0)->after('vp_margin_percent');

            // PDV stopa (promenljiva)
            $table->decimal('vat_percent', 5, 2)->default(20.00)->after('vp_margin_fixed_rsd');

            // Akcija (MP)
            $table->boolean('mp_discount_active')->default(false)->after('vat_percent');

            // Popust u % (primenjuje se na NETO MP osnovicu)
            $table->decimal('mp_discount_percent', 5, 2)->nullable()->after('mp_discount_active');

            /**
             * Fiksni popust u RSD:
             * - tretiramo kao BRUTO iznos koji kupac "vidi" (npr. -500 RSD),
             * - u servisu ga konvertujemo u NETO (deljenjem sa VAT faktorom),
             *   pa tek onda obračunamo PDV.
             */
            $table->unsignedInteger('mp_discount_fixed_rsd')->nullable()->after('mp_discount_percent');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn([
                'cost_rsd',
                'mp_margin_percent', 'mp_margin_fixed_rsd',
                'vp_margin_percent', 'vp_margin_fixed_rsd',
                'vat_percent',
                'mp_discount_active', 'mp_discount_percent', 'mp_discount_fixed_rsd',
            ]);
        });
    }
};
