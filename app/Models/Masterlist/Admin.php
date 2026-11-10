<?php

namespace App\Models\Masterlist;

use Illuminate\Database\Eloquent\Model;

class Admin extends Model
{
    public const ROLE_ADMIN = 'admin';          // view only
    public const ROLE_SUPER = 'super_admin';    // full access

    protected $connection = 'masterlist';
    protected $table = 'admins';

    protected $fillable = ['employid', 'role'];

    // Cached per request so the middleware and shared props don't repeat the query.
    protected static array $roleCache = [];

    public function employee()
    {
        return $this->belongsTo(Employee::class, 'employid', 'employid');
    }

    // 'admin', 'super_admin', or null when the employee is not an admin.
    public static function roleFor($employid): ?string
    {
        if ($employid === null || $employid === '') {
            return null;
        }

        $key = (string) $employid;

        if (! array_key_exists($key, static::$roleCache)) {
            static::$roleCache[$key] = static::where('employid', $key)->value('role');
        }

        return static::$roleCache[$key];
    }

    public static function isAdminEmployid($employid): bool
    {
        return static::roleFor($employid) !== null;
    }

    public static function isSuperAdminEmployid($employid): bool
    {
        return static::roleFor($employid) === self::ROLE_SUPER;
    }
}