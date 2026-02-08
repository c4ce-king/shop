<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        // Tree za "made-in-china" mega meni: top + child + grandchild
        $tree = [
            [
                'name' => 'Demo',
                'slug' => 'demo',
                'sort' => 0,
                'children' => [],
            ],
            [
                'name' => 'Vibratori',
                'slug' => 'vibratori',
                'sort' => 10,
                'children' => [
                    ['name' => 'Wand', 'slug' => 'wand', 'sort' => 10, 'children' => [
                        ['name' => 'Mini wand', 'slug' => 'mini-wand', 'sort' => 10, 'children' => []],
                        ['name' => 'Snažni wand', 'slug' => 'snazni-wand', 'sort' => 20, 'children' => []],
                    ]],
                    ['name' => 'Rabbit', 'slug' => 'rabbit', 'sort' => 20, 'children' => [
                        ['name' => 'Diskretan', 'slug' => 'diskretan', 'sort' => 10, 'children' => []],
                        ['name' => 'Premium', 'slug' => 'premium', 'sort' => 20, 'children' => []],
                    ]],
                    ['name' => 'Mini', 'slug' => 'mini', 'sort' => 30, 'children' => [
                        ['name' => 'Putni', 'slug' => 'putni', 'sort' => 10, 'children' => []],
                        ['name' => 'Pocket', 'slug' => 'pocket', 'sort' => 20, 'children' => []],
                    ]],
                ],
            ],
            [
                'name' => 'Anal',
                'slug' => 'anal',
                'sort' => 20,
                'children' => [
                    ['name' => 'Butt plug', 'slug' => 'butt-plug', 'sort' => 10, 'children' => [
                        ['name' => 'Početnički', 'slug' => 'pocetnicki', 'sort' => 10, 'children' => []],
                        ['name' => 'Metal', 'slug' => 'metal', 'sort' => 20, 'children' => []],
                    ]],
                    ['name' => 'Prostata', 'slug' => 'prostata', 'sort' => 20, 'children' => [
                        ['name' => 'Vibracioni', 'slug' => 'vibracioni', 'sort' => 10, 'children' => []],
                        ['name' => 'Premium', 'slug' => 'premium', 'sort' => 20, 'children' => []],
                    ]],
                    ['name' => 'Perle', 'slug' => 'perle', 'sort' => 30, 'children' => [
                        ['name' => 'Fleksibilne', 'slug' => 'fleksibilne', 'sort' => 10, 'children' => []],
                        ['name' => 'Veće', 'slug' => 'vece', 'sort' => 20, 'children' => []],
                    ]],
                ],
            ],
            [
                'name' => 'Lubrikanti',
                'slug' => 'lubrikanti',
                'sort' => 30,
                'children' => [
                    ['name' => 'Na bazi vode', 'slug' => 'na-bazi-vode', 'sort' => 10, 'children' => [
                        ['name' => 'Sensitive', 'slug' => 'sensitive', 'sort' => 10, 'children' => []],
                        ['name' => 'Veliko pakovanje', 'slug' => 'veliko-pakovanje', 'sort' => 20, 'children' => []],
                    ]],
                    ['name' => 'Silikonski', 'slug' => 'silikonski', 'sort' => 20, 'children' => [
                        ['name' => 'Long lasting', 'slug' => 'long-lasting', 'sort' => 10, 'children' => []],
                        ['name' => 'Premium', 'slug' => 'premium', 'sort' => 20, 'children' => []],
                    ]],
                    ['name' => 'Anal lube', 'slug' => 'anal-lube', 'sort' => 30, 'children' => [
                        ['name' => 'Extra gusto', 'slug' => 'extra-gusto', 'sort' => 10, 'children' => []],
                        ['name' => 'Relax', 'slug' => 'relax', 'sort' => 20, 'children' => []],
                    ]],
                ],
            ],
            [
                'name' => 'BDSM',
                'slug' => 'bdsm',
                'sort' => 40,
                'children' => [
                    ['name' => 'Lisice', 'slug' => 'lisice', 'sort' => 10, 'children' => [
                        ['name' => 'Metal', 'slug' => 'metal', 'sort' => 10, 'children' => []],
                        ['name' => 'Koža', 'slug' => 'koza', 'sort' => 20, 'children' => []],
                    ]],
                    ['name' => 'Bičevi', 'slug' => 'bicevi', 'sort' => 20, 'children' => [
                        ['name' => 'Mini', 'slug' => 'mini', 'sort' => 10, 'children' => []],
                        ['name' => 'Premium', 'slug' => 'premium', 'sort' => 20, 'children' => []],
                    ]],
                    ['name' => 'Maske', 'slug' => 'maske', 'sort' => 30, 'children' => [
                        ['name' => 'Oči', 'slug' => 'oci', 'sort' => 10, 'children' => []],
                        ['name' => 'Full', 'slug' => 'full', 'sort' => 20, 'children' => []],
                    ]],
                ],
            ],
            [
                'name' => 'Kondomi',
                'slug' => 'kondomi',
                'sort' => 50,
                'children' => [
                    ['name' => 'Klasični', 'slug' => 'klasicni', 'sort' => 10, 'children' => [
                        ['name' => 'Tanki', 'slug' => 'tanki', 'sort' => 10, 'children' => []],
                        ['name' => 'Ultra tanki', 'slug' => 'ultra-tanki', 'sort' => 20, 'children' => []],
                    ]],
                    ['name' => 'Rebrasti', 'slug' => 'rebrasti', 'sort' => 20, 'children' => [
                        ['name' => 'Stim', 'slug' => 'stim', 'sort' => 10, 'children' => []],
                        ['name' => 'Extra', 'slug' => 'extra', 'sort' => 20, 'children' => []],
                    ]],
                    ['name' => 'Delay', 'slug' => 'delay', 'sort' => 30, 'children' => [
                        ['name' => 'Light', 'slug' => 'light', 'sort' => 10, 'children' => []],
                        ['name' => 'Strong', 'slug' => 'strong', 'sort' => 20, 'children' => []],
                    ]],
                ],
            ],
            [
                'name' => 'Za parove',
                'slug' => 'za-parove',
                'sort' => 60,
                'children' => [
                    ['name' => 'Prstenovi', 'slug' => 'prstenovi', 'sort' => 10, 'children' => [
                        ['name' => 'Vibracioni', 'slug' => 'vibracioni', 'sort' => 10, 'children' => []],
                        ['name' => 'Silicone', 'slug' => 'silicone', 'sort' => 20, 'children' => []],
                    ]],
                    ['name' => 'Igračke na daljinski', 'slug' => 'na-daljinski', 'sort' => 20, 'children' => [
                        ['name' => 'App control', 'slug' => 'app-control', 'sort' => 10, 'children' => []],
                        ['name' => 'Remote', 'slug' => 'remote', 'sort' => 20, 'children' => []],
                    ]],
                    ['name' => 'Setovi', 'slug' => 'setovi', 'sort' => 30, 'children' => [
                        ['name' => 'Starter', 'slug' => 'starter', 'sort' => 10, 'children' => []],
                        ['name' => 'Premium', 'slug' => 'premium', 'sort' => 20, 'children' => []],
                    ]],
                ],
            ],
        ];

        // 1) Insert/Upsert categories (idempotent: koristi slug_path unique)
        $this->seedTree($tree, null, null);

        // 2) Rebuild closure table (da listing po grani radi)
        $this->rebuildClosure();

        // 3) Poveži proizvode na leaf kategorije (da mega meni + listing odmah imaju “materijal”)
        $this->attachProductsToLeaves(80);
    }

    private function seedTree(array $nodes, ?int $parentId, ?string $parentPath): void
    {
        foreach ($nodes as $n) {
            $name = $n['name'];
            $slug = $n['slug'];
            $sort = (int)($n['sort'] ?? 0);
            $children = $n['children'] ?? [];

            $slugPath = $parentPath ? ($parentPath . '/' . $slug) : $slug;

            $existing = DB::table('categories')->where('slug_path', $slugPath)->first();

            if ($existing) {
                DB::table('categories')->where('id', $existing->id)->update([
                    'parent_id' => $parentId,
                    'name' => $name,
                    'slug' => $slug,
                    'sort' => $sort,
                    'is_active' => 1,
                    'updated_at' => now(),
                ]);
                $id = (int)$existing->id;
            } else {
                $id = (int)DB::table('categories')->insertGetId([
                    'parent_id' => $parentId,
                    'name' => $name,
                    'slug' => $slug,
                    'slug_path' => $slugPath,
                    'sort' => $sort,
                    'is_active' => 1,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            if (!empty($children)) {
                $this->seedTree($children, $id, $slugPath);
            }
        }
    }

    private function rebuildClosure(): void
    {
        // čist closure (bez diranja categories)
        DB::statement('SET FOREIGN_KEY_CHECKS=0');
        DB::table('category_closure')->truncate();
        DB::statement('SET FOREIGN_KEY_CHECKS=1');

        $cats = DB::table('categories')->get(['id', 'parent_id']);
        $parentOf = [];
        foreach ($cats as $c) {
            $parentOf[(int)$c->id] = $c->parent_id ? (int)$c->parent_id : null;
        }

        $rows = [];
        foreach ($parentOf as $id => $pid) {
            // self
            $rows[] = ['ancestor_id' => $id, 'descendant_id' => $id, 'depth' => 0];

            // ancestors
            $depth = 1;
            $cur = $pid;
            while ($cur !== null) {
                $rows[] = ['ancestor_id' => $cur, 'descendant_id' => $id, 'depth' => $depth];
                $cur = $parentOf[$cur] ?? null;
                $depth++;
                if ($depth > 50) break; // safety
            }
        }

        // bulk insert u chunkovima
        foreach (array_chunk($rows, 1000) as $chunk) {
            DB::table('category_closure')->insert($chunk);
        }
    }

    private function attachProductsToLeaves(int $limitProducts): void
    {
        // leaf = kategorija koja nema decu
        $all = DB::table('categories')->get(['id', 'parent_id']);
        $hasChildren = [];
        foreach ($all as $c) {
            if ($c->parent_id) $hasChildren[(int)$c->parent_id] = true;
        }

        $leafIds = [];
        foreach ($all as $c) {
            $id = (int)$c->id;
            if (!isset($hasChildren[$id])) $leafIds[] = $id;
        }
        if (count($leafIds) === 0) return;

        $pids = DB::table('products')->orderBy('id')->limit($limitProducts)->pluck('id')->all();
        if (count($pids) === 0) return;

        $rows = [];
        $i = 0;
        foreach ($pids as $pid) {
            $catId = $leafIds[$i % count($leafIds)];
            $rows[] = ['category_id' => $catId, 'product_id' => (int)$pid];
            $i++;
        }

        // insertOrIgnore da ne puca na duplikate
        foreach (array_chunk($rows, 1000) as $chunk) {
            DB::table('category_product')->insertOrIgnore($chunk);
        }
    }
}
